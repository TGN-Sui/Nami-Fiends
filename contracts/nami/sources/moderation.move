module nami::moderation {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::conduct;
    use nami::errors;
    use nami::passport;

    // =========================================================
    // MODERATION ACTION TYPES
    // =========================================================
    const ACTION_WARNING: u8 = 1;
    const ACTION_MUTE: u8 = 2;
    const ACTION_CHANNEL_BAN: u8 = 3;
    const ACTION_BLACK_PASSPORT: u8 = 4;

    // =========================================================
    // MODERATION RECORD
    // =========================================================
    public struct ModerationRecord has key {
        id: UID,

        moderator: address,
        target_owner: address,
        passport_id: address,

        action_type: u8,

        /// Channel-specific actions use this field.
        /// Global actions may use @0x0.
        channel_id: address,

        reason_code: u64,

        /// 0 means no expiration.
        expires_at_ms: u64,

        created_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct WarningIssued has copy, drop {
        moderator: address,
        target_owner: address,
        passport_id: address,
        reason_code: u64,
    }

    public struct MuteIssued has copy, drop {
        moderator: address,
        target_owner: address,
        passport_id: address,
        channel_id: address,
        reason_code: u64,
        expires_at_ms: u64,
    }

    public struct ChannelBanIssued has copy, drop {
        moderator: address,
        target_owner: address,
        passport_id: address,
        channel_id: address,
        reason_code: u64,
        expires_at_ms: u64,
    }

    public struct BlackPassportIssued has copy, drop {
        moderator: address,
        target_owner: address,
        passport_id: address,
        reason_code: u64,
        respawn_at_ms: u64,
    }

    // =========================================================
    // INTERNAL RECORD CREATION
    // =========================================================
    fun create_record(
        moderator: address,
        target_owner: address,
        passport_id: address,
        action_type: u8,
        channel_id: address,
        reason_code: u64,
        expires_at_ms: u64,
        ctx: &mut TxContext
    ): ModerationRecord {
        ModerationRecord {
            id: object::new(ctx),
            moderator,
            target_owner,
            passport_id,
            action_type,
            channel_id,
            reason_code,
            expires_at_ms,
            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
        }
    }

    // =========================================================
    // ISSUE WARNING
    // Package-only until moderator authority exists.
    // =========================================================
    public(package) fun issue_warning(
        target_owner: address,
        passport_obj: &passport::Passport,
        reason_code: u64,
        ctx: &mut TxContext
    ) {
        let moderator = tx_context::sender(ctx);
        let passport_id = passport::get_id(passport_obj);

        let record = create_record(
            moderator,
            target_owner,
            passport_id,
            ACTION_WARNING,
            @0x0,
            reason_code,
            0,
            ctx
        );

        sui::event::emit(WarningIssued {
            moderator,
            target_owner,
            passport_id,
            reason_code,
        });

        transfer::transfer(record, target_owner);
    }

    // =========================================================
    // ISSUE MUTE
    // Package-only until moderator authority exists.
    // =========================================================
    public(package) fun issue_mute(
        target_owner: address,
        passport_obj: &passport::Passport,
        channel_id: address,
        reason_code: u64,
        expires_at_ms: u64,
        ctx: &mut TxContext
    ) {
        let moderator = tx_context::sender(ctx);
        let now = tx_context::epoch_timestamp_ms(ctx);
        let passport_id = passport::get_id(passport_obj);

        assert!(
            expires_at_ms > now,
            errors::invalid_moderation_duration()
        );

        let record = create_record(
            moderator,
            target_owner,
            passport_id,
            ACTION_MUTE,
            channel_id,
            reason_code,
            expires_at_ms,
            ctx
        );

        sui::event::emit(MuteIssued {
            moderator,
            target_owner,
            passport_id,
            channel_id,
            reason_code,
            expires_at_ms,
        });

        transfer::transfer(record, target_owner);
    }

    // =========================================================
    // ISSUE CHANNEL BAN
    // Package-only until channel moderation authority exists.
    // =========================================================
    public(package) fun issue_channel_ban(
        target_owner: address,
        passport_obj: &passport::Passport,
        channel_id: address,
        reason_code: u64,
        expires_at_ms: u64,
        ctx: &mut TxContext
    ) {
        let moderator = tx_context::sender(ctx);
        let now = tx_context::epoch_timestamp_ms(ctx);
        let passport_id = passport::get_id(passport_obj);

        assert!(
            expires_at_ms > now,
            errors::invalid_moderation_duration()
        );

        let record = create_record(
            moderator,
            target_owner,
            passport_id,
            ACTION_CHANNEL_BAN,
            channel_id,
            reason_code,
            expires_at_ms,
            ctx
        );

        sui::event::emit(ChannelBanIssued {
            moderator,
            target_owner,
            passport_id,
            channel_id,
            reason_code,
            expires_at_ms,
        });

        transfer::transfer(record, target_owner);
    }

    // =========================================================
    // ISSUE BLACK PASSPORT
    // Package-only until global moderation authority exists.
    // This calls conduct.move and sets Passport Signal to Black.
    // =========================================================
    public(package) fun issue_black_passport(
        target_owner: address,
        passport_obj: &passport::Passport,
        conduct_status: &mut conduct::ConductStatus,
        reason_code: u64,
        respawn_at_ms: u64,
        ctx: &mut TxContext
    ) {
        let moderator = tx_context::sender(ctx);
        let passport_id = passport::get_id(passport_obj);

        assert!(
            conduct::get_passport_id(conduct_status) == passport_id,
            errors::invalid_owner()
        );

        conduct::down_passport(
            conduct_status,
            reason_code,
            respawn_at_ms,
            ctx
        );

        let record = create_record(
            moderator,
            target_owner,
            passport_id,
            ACTION_BLACK_PASSPORT,
            @0x0,
            reason_code,
            respawn_at_ms,
            ctx
        );

        sui::event::emit(BlackPassportIssued {
            moderator,
            target_owner,
            passport_id,
            reason_code,
            respawn_at_ms,
        });

        transfer::transfer(record, target_owner);
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_moderator(record: &ModerationRecord): address {
        record.moderator
    }

    public fun get_target_owner(record: &ModerationRecord): address {
        record.target_owner
    }

    public fun get_passport_id(record: &ModerationRecord): address {
        record.passport_id
    }

    public fun get_action_type(record: &ModerationRecord): u8 {
        record.action_type
    }

    public fun get_channel_id(record: &ModerationRecord): address {
        record.channel_id
    }

    public fun get_reason_code(record: &ModerationRecord): u64 {
        record.reason_code
    }

    public fun get_expires_at_ms(record: &ModerationRecord): u64 {
        record.expires_at_ms
    }

    public fun is_warning(record: &ModerationRecord): bool {
        record.action_type == ACTION_WARNING
    }

    public fun is_mute(record: &ModerationRecord): bool {
        record.action_type == ACTION_MUTE
    }

    public fun is_channel_ban(record: &ModerationRecord): bool {
        record.action_type == ACTION_CHANNEL_BAN
    }

    public fun is_black_passport(record: &ModerationRecord): bool {
        record.action_type == ACTION_BLACK_PASSPORT
    }
}