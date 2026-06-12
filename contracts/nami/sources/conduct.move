module nami::conduct {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::errors;
    use nami::passport;

    // =========================================================
    // PASSPORT SIGNALS
    // =========================================================
    const GREEN: u8 = 1;
    const ORANGE: u8 = 2;
    const RED: u8 = 3;
    const BLACK: u8 = 4;

    // =========================================================
    // CONDUCT STATUS OBJECT
    // =========================================================
    public struct ConductStatus has key {
        id: UID,

        owner: address,

        passport_id: address,

        /// Green, Orange, Red, or Black.
        signal: u8,

        /// Reason code for latest system/moderation update.
        reason_code: u64,

        /// Used mainly for Black Passport.
        /// 0 means no active expiration.
        expires_at_ms: u64,

        created_at_ms: u64,
        updated_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct ConductStatusCreated has copy, drop {
        owner: address,
        passport_id: address,
        signal: u8,
    }

    public struct ConductSignalUpdated has copy, drop {
        owner: address,
        passport_id: address,
        old_signal: u8,
        new_signal: u8,
        reason_code: u64,
        expires_at_ms: u64,
    }

    public struct PassportDowned has copy, drop {
        owner: address,
        passport_id: address,
        reason_code: u64,
        respawn_at_ms: u64,
    }

    public struct PassportRespawned has copy, drop {
        owner: address,
        passport_id: address,
        restored_signal: u8,
    }

    // =========================================================
    // HELPERS
    // =========================================================
    fun is_user_selectable_signal(signal: u8): bool {
        signal == GREEN ||
        signal == ORANGE ||
        signal == RED
    }

    fun is_valid_signal(signal: u8): bool {
        signal == GREEN ||
        signal == ORANGE ||
        signal == RED ||
        signal == BLACK
    }

    fun is_active_black(
        status: &ConductStatus,
        now_ms: u64
    ): bool {
        status.signal == BLACK && status.expires_at_ms > now_ms
    }

    // =========================================================
    // CREATE CONDUCT STATUS
    // User may choose Green, Orange, or Red.
    // User may not choose Black.
    // =========================================================
    public fun create_status(
        passport_obj: &passport::Passport,
        initial_signal: u8,
        ctx: &mut TxContext
    ) {
        assert!(
            is_user_selectable_signal(initial_signal),
            errors::invalid_conduct_signal()
        );

        let owner = tx_context::sender(ctx);
        let now = tx_context::epoch_timestamp_ms(ctx);

        let status = ConductStatus {
            id: object::new(ctx),
            owner,
            passport_id: passport::get_id(passport_obj),
            signal: initial_signal,
            reason_code: 0,
            expires_at_ms: 0,
            created_at_ms: now,
            updated_at_ms: now,
        };

        sui::event::emit(ConductStatusCreated {
            owner,
            passport_id: passport::get_id(passport_obj),
            signal: initial_signal,
        });

        transfer::transfer(status, owner);
    }

    // =========================================================
    // USER SIGNAL UPDATE
    // Users may update between Green, Orange, and Red.
    // Users may not set themselves to Black.
    // Active Black Passport cannot self-change until respawn.
    // =========================================================
    public fun update_signal(
        status: &mut ConductStatus,
        new_signal: u8,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let now = tx_context::epoch_timestamp_ms(ctx);

        assert!(
            sender == status.owner,
            errors::invalid_owner()
        );

        assert!(
            is_user_selectable_signal(new_signal),
            errors::invalid_conduct_signal()
        );

        assert!(
            !is_active_black(status, now),
            errors::conduct_restricted()
        );

        let old_signal = status.signal;

        status.signal = new_signal;
        status.reason_code = 0;
        status.expires_at_ms = 0;
        status.updated_at_ms = now;

        sui::event::emit(ConductSignalUpdated {
            owner: sender,
            passport_id: status.passport_id,
            old_signal,
            new_signal,
            reason_code: 0,
            expires_at_ms: 0,
        });
    }

    // =========================================================
    // DOWN PASSPORT
    // Package-only until moderation.move exists.
    // This represents Black Passport.
    // =========================================================
    public(package) fun down_passport(
        status: &mut ConductStatus,
        reason_code: u64,
        respawn_at_ms: u64,
        ctx: &TxContext
    ) {
        let now = tx_context::epoch_timestamp_ms(ctx);

        assert!(
            respawn_at_ms > now,
            errors::respawn_not_ready()
        );

        let old_signal = status.signal;

        status.signal = BLACK;
        status.reason_code = reason_code;
        status.expires_at_ms = respawn_at_ms;
        status.updated_at_ms = now;

        sui::event::emit(ConductSignalUpdated {
            owner: status.owner,
            passport_id: status.passport_id,
            old_signal,
            new_signal: BLACK,
            reason_code,
            expires_at_ms: respawn_at_ms,
        });

        sui::event::emit(PassportDowned {
            owner: status.owner,
            passport_id: status.passport_id,
            reason_code,
            respawn_at_ms,
        });
    }

    // =========================================================
    // RESPAWN PASSPORT
    // Restores Green, Orange, or Red after Black expires.
    // =========================================================
    public fun respawn_if_ready(
        status: &mut ConductStatus,
        restored_signal: u8,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let now = tx_context::epoch_timestamp_ms(ctx);

        assert!(
            sender == status.owner,
            errors::invalid_owner()
        );

        assert!(
            status.signal == BLACK,
            errors::conduct_not_restricted()
        );

        assert!(
            now >= status.expires_at_ms,
            errors::respawn_not_ready()
        );

        assert!(
            is_user_selectable_signal(restored_signal),
            errors::invalid_conduct_signal()
        );

        let old_signal = status.signal;

        status.signal = restored_signal;
        status.reason_code = 0;
        status.expires_at_ms = 0;
        status.updated_at_ms = now;

        sui::event::emit(ConductSignalUpdated {
            owner: sender,
            passport_id: status.passport_id,
            old_signal,
            new_signal: restored_signal,
            reason_code: 0,
            expires_at_ms: 0,
        });

        sui::event::emit(PassportRespawned {
            owner: sender,
            passport_id: status.passport_id,
            restored_signal,
        });
    }

    // =========================================================
    // BENEFIT CHECK
    // Future membership and boost logic will use this.
    // =========================================================
    public fun has_active_benefits(
        status: &ConductStatus,
        ctx: &TxContext
    ): bool {
        let now = tx_context::epoch_timestamp_ms(ctx);

        !is_active_black(status, now)
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_owner(status: &ConductStatus): address {
        status.owner
    }

    public fun get_passport_id(status: &ConductStatus): address {
        status.passport_id
    }

    public fun get_signal(status: &ConductStatus): u8 {
        status.signal
    }

    public fun get_reason_code(status: &ConductStatus): u64 {
        status.reason_code
    }

    public fun get_expires_at_ms(status: &ConductStatus): u64 {
        status.expires_at_ms
    }

    public fun is_green(status: &ConductStatus): bool {
        status.signal == GREEN
    }

    public fun is_orange(status: &ConductStatus): bool {
        status.signal == ORANGE
    }

    public fun is_red(status: &ConductStatus): bool {
        status.signal == RED
    }

    public fun is_black(status: &ConductStatus): bool {
        status.signal == BLACK
    }

    public fun is_valid_public_signal(signal: u8): bool {
        is_valid_signal(signal)
    }
}