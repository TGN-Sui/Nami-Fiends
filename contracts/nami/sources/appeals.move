module nami::appeals {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::errors;
    use nami::moderation;
    use nami::passport;

    // =========================================================
    // APPEAL STATUS
    // =========================================================
    const STATUS_OPEN: u8 = 1;
    const STATUS_APPROVED: u8 = 2;
    const STATUS_DENIED: u8 = 3;
    const STATUS_MODIFIED: u8 = 4;

    // =========================================================
    // APPEAL CASE OBJECT
    // =========================================================
    public struct AppealCase has key {
        id: UID,

        appellant: address,

        passport_id: address,

        moderation_record_id: address,

        moderation_action_type: u8,

        moderation_reason_code: u64,

        status: u8,

        /// Public appeal reference only.
        /// Do not place private evidence directly on-chain.
        public_reference: vector<u8>,

        resolution_code: u64,

        created_at_ms: u64,
        resolved_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct AppealOpened has copy, drop {
        appeal_id: address,
        appellant: address,
        passport_id: address,
        moderation_record_id: address,
        moderation_action_type: u8,
        moderation_reason_code: u64,
    }

    public struct AppealResolved has copy, drop {
        appeal_id: address,
        appellant: address,
        passport_id: address,
        result_status: u8,
        resolution_code: u64,
    }

    // =========================================================
    // HELPERS
    // =========================================================
    fun is_valid_result_status(result_status: u8): bool {
        result_status == STATUS_APPROVED ||
        result_status == STATUS_DENIED ||
        result_status == STATUS_MODIFIED
    }

    // =========================================================
    // OPEN APPEAL
    // User may open appeal for their own moderation record.
    //
    // public_reference should be an off-chain reference, summary hash,
    // case label, or empty vector. Do not store private evidence here.
    // =========================================================
    public fun open_appeal(
        passport_obj: &passport::Passport,
        moderation_record: &moderation::ModerationRecord,
        public_reference: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert!(
            moderation::get_target_owner(moderation_record) == sender,
            errors::appeal_unauthorized()
        );

        assert!(
            moderation::get_passport_id(moderation_record) == passport::get_id(passport_obj),
            errors::appeal_unauthorized()
        );

        let appeal = AppealCase {
            id: object::new(ctx),
            appellant: sender,
            passport_id: passport::get_id(passport_obj),
            moderation_record_id: moderation::get_id(moderation_record),
            moderation_action_type: moderation::get_action_type(moderation_record),
            moderation_reason_code: moderation::get_reason_code(moderation_record),
            status: STATUS_OPEN,
            public_reference,
            resolution_code: 0,
            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
            resolved_at_ms: 0,
        };

        let appeal_id = object::uid_to_address(&appeal.id);

        sui::event::emit(AppealOpened {
            appeal_id,
            appellant: sender,
            passport_id: appeal.passport_id,
            moderation_record_id: appeal.moderation_record_id,
            moderation_action_type: appeal.moderation_action_type,
            moderation_reason_code: appeal.moderation_reason_code,
        });

        transfer::transfer(appeal, sender);
    }

    // =========================================================
    // RESOLVE APPEAL
    // Package-only until admin / jury authority path is finalized.
    // =========================================================
    public(package) fun resolve_appeal(
        appeal: &mut AppealCase,
        result_status: u8,
        resolution_code: u64,
        ctx: &TxContext
    ) {
        assert!(
            appeal.status == STATUS_OPEN,
            errors::appeal_already_resolved()
        );

        assert!(
            is_valid_result_status(result_status),
            errors::invalid_appeal_result()
        );

        appeal.status = result_status;
        appeal.resolution_code = resolution_code;
        appeal.resolved_at_ms = tx_context::epoch_timestamp_ms(ctx);

        sui::event::emit(AppealResolved {
            appeal_id: object::uid_to_address(&appeal.id),
            appellant: appeal.appellant,
            passport_id: appeal.passport_id,
            result_status,
            resolution_code,
        });
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_id(appeal: &AppealCase): address {
        object::uid_to_address(&appeal.id)
    }

    public fun get_appellant(appeal: &AppealCase): address {
        appeal.appellant
    }

    public fun get_passport_id(appeal: &AppealCase): address {
        appeal.passport_id
    }

    public fun get_moderation_record_id(appeal: &AppealCase): address {
        appeal.moderation_record_id
    }

    public fun get_moderation_action_type(appeal: &AppealCase): u8 {
        appeal.moderation_action_type
    }

    public fun get_moderation_reason_code(appeal: &AppealCase): u64 {
        appeal.moderation_reason_code
    }

    public fun get_status(appeal: &AppealCase): u8 {
        appeal.status
    }

    public fun get_resolution_code(appeal: &AppealCase): u64 {
        appeal.resolution_code
    }

    public fun is_open(appeal: &AppealCase): bool {
        appeal.status == STATUS_OPEN
    }

    public fun is_approved(appeal: &AppealCase): bool {
        appeal.status == STATUS_APPROVED
    }

    public fun is_denied(appeal: &AppealCase): bool {
        appeal.status == STATUS_DENIED
    }

    public fun is_modified(appeal: &AppealCase): bool {
        appeal.status == STATUS_MODIFIED
    }
}