module nami::admin {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::appeals;
    use nami::badge_issuer;
    use nami::channel;
    use nami::conduct;
    use nami::cosmetics;
    use nami::jury;
    use nami::membership;
    use nami::moderation;
    use nami::passport;
    use nami::recovery;

    // =========================================================
    // ADMIN ACTION TYPES
    // =========================================================
    const ACTION_APPROVE_BADGE_ISSUER: u8 = 1;
    const ACTION_UPGRADE_TO_PRO: u8 = 2;
    const ACTION_UPGRADE_TO_ELITE: u8 = 3;
    const ACTION_WARNING: u8 = 4;
    const ACTION_MUTE: u8 = 5;
    const ACTION_CHANNEL_BAN: u8 = 6;
    const ACTION_BLACK_PASSPORT: u8 = 7;
    const ACTION_RESOLVE_APPEAL: u8 = 8;
    const ACTION_OPEN_JURY_CASE: u8 = 9;
    const ACTION_CLOSE_JURY_CASE: u8 = 10;
    const ACTION_GRANT_COSMETIC: u8 = 11;
    const ACTION_RESOLVE_RECOVERY: u8 = 12;
    const ACTION_VERIFY_CHANNEL: u8 = 13;

    // =========================================================
    // ADMIN CAPABILITY
    // =========================================================
    public struct AdminCap has key {
        id: UID,
        created_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct AdminAction has copy, drop {
        admin_cap_id: address,
        action_type: u8,
        target: address,
    }

    // =========================================================
    // PACKAGE INIT
    // Creates AdminCap on package publish.
    // =========================================================
    fun init(ctx: &mut TxContext) {
        let cap = AdminCap {
            id: object::new(ctx),
            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
        };

        transfer::transfer(cap, tx_context::sender(ctx));
    }

    // =========================================================
    // TEST ONLY ADMIN CAP
    // =========================================================
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        let cap = AdminCap {
            id: object::new(ctx),
            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
        };

        transfer::transfer(cap, tx_context::sender(ctx));
    }

    // =========================================================
    // INTERNAL ACTION EVENT
    // =========================================================
    fun emit_admin_action(
        admin: &AdminCap,
        action_type: u8,
        target: address
    ) {
        sui::event::emit(AdminAction {
            admin_cap_id: object::uid_to_address(&admin.id),
            action_type,
            target,
        });
    }

    // =========================================================
    // BADGE ISSUER AUTHORITY
    // =========================================================
    public fun approve_badge_issuer(
        admin: &AdminCap,
        owner: address,
        issuer_id: address,
        issuer_type: u8,
        can_issue_basic: bool,
        can_issue_event: bool,
        can_issue_completion: bool,
        ctx: &mut TxContext
    ) {
        badge_issuer::create_issuer_cap(
            owner,
            issuer_id,
            issuer_type,
            can_issue_basic,
            can_issue_event,
            can_issue_completion,
            ctx
        );

        emit_admin_action(
            admin,
            ACTION_APPROVE_BADGE_ISSUER,
            issuer_id
        );
    }

    // =========================================================
    // MEMBERSHIP AUTHORITY
    // =========================================================
    public fun upgrade_to_pro(
        admin: &AdminCap,
        passport_obj: &mut passport::Passport,
        expires_at_ms: u64,
        ctx: &mut TxContext
    ) {
        membership::upgrade_to_pro(
            passport_obj,
            expires_at_ms,
            ctx
        );

        emit_admin_action(
            admin,
            ACTION_UPGRADE_TO_PRO,
            passport::get_id(passport_obj)
        );
    }

    public fun upgrade_to_elite(
        admin: &AdminCap,
        passport_obj: &mut passport::Passport,
        expires_at_ms: u64,
        ctx: &mut TxContext
    ) {
        membership::upgrade_to_elite(
            passport_obj,
            expires_at_ms,
            ctx
        );

        emit_admin_action(
            admin,
            ACTION_UPGRADE_TO_ELITE,
            passport::get_id(passport_obj)
        );
    }

    // =========================================================
    // MODERATION AUTHORITY
    // =========================================================
    public fun issue_warning(
        admin: &AdminCap,
        target_owner: address,
        passport_obj: &passport::Passport,
        reason_code: u64,
        ctx: &mut TxContext
    ) {
        moderation::issue_warning(
            target_owner,
            passport_obj,
            reason_code,
            ctx
        );

        emit_admin_action(
            admin,
            ACTION_WARNING,
            passport::get_id(passport_obj)
        );
    }

    public fun issue_mute(
        admin: &AdminCap,
        target_owner: address,
        passport_obj: &passport::Passport,
        channel_id: address,
        reason_code: u64,
        expires_at_ms: u64,
        ctx: &mut TxContext
    ) {
        moderation::issue_mute(
            target_owner,
            passport_obj,
            channel_id,
            reason_code,
            expires_at_ms,
            ctx
        );

        emit_admin_action(
            admin,
            ACTION_MUTE,
            passport::get_id(passport_obj)
        );
    }

    public fun issue_channel_ban(
        admin: &AdminCap,
        target_owner: address,
        passport_obj: &passport::Passport,
        channel_id: address,
        reason_code: u64,
        expires_at_ms: u64,
        ctx: &mut TxContext
    ) {
        moderation::issue_channel_ban(
            target_owner,
            passport_obj,
            channel_id,
            reason_code,
            expires_at_ms,
            ctx
        );

        emit_admin_action(
            admin,
            ACTION_CHANNEL_BAN,
            passport::get_id(passport_obj)
        );
    }

    public fun issue_black_passport(
        admin: &AdminCap,
        target_owner: address,
        passport_obj: &passport::Passport,
        conduct_status: &mut conduct::ConductStatus,
        reason_code: u64,
        respawn_at_ms: u64,
        ctx: &mut TxContext
    ) {
        moderation::issue_black_passport(
            target_owner,
            passport_obj,
            conduct_status,
            reason_code,
            respawn_at_ms,
            ctx
        );

        emit_admin_action(
            admin,
            ACTION_BLACK_PASSPORT,
            passport::get_id(passport_obj)
        );
    }

    // =========================================================
    // APPEAL AUTHORITY
    // =========================================================
    public fun resolve_appeal(
        admin: &AdminCap,
        appeal: &mut appeals::AppealCase,
        result_status: u8,
        resolution_code: u64,
        ctx: &TxContext
    ) {
        appeals::resolve_appeal(
            appeal,
            result_status,
            resolution_code,
            ctx
        );

        emit_admin_action(
            admin,
            ACTION_RESOLVE_APPEAL,
            appeals::get_id(appeal)
        );
    }

    // =========================================================
    // JURY AUTHORITY
    // =========================================================
    public fun open_jury_case(
        admin: &AdminCap,
        appeal: &appeals::AppealCase,
        required_votes: u64,
        ctx: &mut TxContext
    ) {
        jury::open_jury_case(
            appeal,
            required_votes,
            ctx
        );

        emit_admin_action(
            admin,
            ACTION_OPEN_JURY_CASE,
            appeals::get_id(appeal)
        );
    }

    public fun close_jury_case(
        admin: &AdminCap,
        jury_case: &mut jury::JuryCase,
        ctx: &TxContext
    ) {
        jury::close_jury_case(
            jury_case,
            ctx
        );

        emit_admin_action(
            admin,
            ACTION_CLOSE_JURY_CASE,
            jury::get_id(jury_case)
        );
    }

    // =========================================================
    // COSMETIC AUTHORITY
    // =========================================================
    public fun grant_cosmetic_unlock(
        admin: &AdminCap,
        owner: address,
        passport_obj: &passport::Passport,
        cosmetic_type: u8,
        cosmetic_code: u64,
        source_code: u64,
        ctx: &mut TxContext
    ) {
        cosmetics::grant_cosmetic_unlock(
            owner,
            passport_obj,
            cosmetic_type,
            cosmetic_code,
            source_code,
            ctx
        );

        emit_admin_action(
            admin,
            ACTION_GRANT_COSMETIC,
            passport::get_id(passport_obj)
        );
    }

    // =========================================================
    // RECOVERY AUTHORITY
    // =========================================================
    public fun resolve_recovery_request(
        admin: &AdminCap,
        request: &mut recovery::RecoveryRequest,
        result_status: u8,
        resolution_code: u64,
        ctx: &TxContext
    ) {
        recovery::resolve_recovery_request(
            request,
            result_status,
            resolution_code,
            ctx
        );

        emit_admin_action(
            admin,
            ACTION_RESOLVE_RECOVERY,
            recovery::get_id(request)
        );
    }

    // =========================================================
    // CHANNEL AUTHORITY
    // =========================================================
    public fun verify_channel(
        admin: &AdminCap,
        channel_obj: &mut channel::Channel,
        ctx: &TxContext
    ) {
        channel::verify_channel(
            channel_obj,
            ctx
        );

        emit_admin_action(
            admin,
            ACTION_VERIFY_CHANNEL,
            channel::get_id(channel_obj)
        );
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_id(admin: &AdminCap): address {
        object::uid_to_address(&admin.id)
    }

    public fun get_created_at_ms(admin: &AdminCap): u64 {
        admin.created_at_ms
    }
}