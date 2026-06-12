module nami::cosmetics {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::conduct;
    use nami::errors;
    use nami::passport;

    // =========================================================
    // COSMETIC TYPES
    // =========================================================
    const PROFILE_FRAME: u8 = 1;
    const PASSPORT_THEME: u8 = 2;
    const CHAT_OVERLAY: u8 = 3;
    const AVATAR_STYLE: u8 = 4;
    const BADGE_DISPLAY: u8 = 5;
    const TITLE_EFFECT: u8 = 6;

    // =========================================================
    // DEFAULT EQUIPPED STATE
    // =========================================================
    const NONE: u64 = 0;

    // =========================================================
    // COSMETIC UNLOCK PROOF
    // =========================================================
    public struct CosmeticUnlock has key {
        id: UID,

        owner: address,
        passport_id: address,

        cosmetic_type: u8,

        /// Specific cosmetic identifier.
        /// Example: profile frame #1001, passport theme #2001, etc.
        cosmetic_code: u64,

        /// Future hook for season, badge, event, guild, prestige, shop, etc.
        source_code: u64,

        created_at_ms: u64,
    }

    // =========================================================
    // COSMETIC LOADOUT
    // =========================================================
    public struct CosmeticLoadout has key {
        id: UID,

        owner: address,
        passport_id: address,

        profile_frame_code: u64,
        passport_theme_code: u64,
        chat_overlay_code: u64,
        avatar_style_code: u64,
        badge_display_code: u64,
        title_effect_code: u64,

        created_at_ms: u64,
        updated_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct CosmeticUnlocked has copy, drop {
        owner: address,
        passport_id: address,
        cosmetic_type: u8,
        cosmetic_code: u64,
        source_code: u64,
    }

    public struct CosmeticLoadoutCreated has copy, drop {
        owner: address,
        passport_id: address,
    }

    public struct CosmeticEquipped has copy, drop {
        owner: address,
        passport_id: address,
        cosmetic_type: u8,
        cosmetic_code: u64,
    }

    // =========================================================
    // HELPERS
    // =========================================================
    fun is_valid_cosmetic_type(cosmetic_type: u8): bool {
        cosmetic_type == PROFILE_FRAME ||
        cosmetic_type == PASSPORT_THEME ||
        cosmetic_type == CHAT_OVERLAY ||
        cosmetic_type == AVATAR_STYLE ||
        cosmetic_type == BADGE_DISPLAY ||
        cosmetic_type == TITLE_EFFECT
    }

    fun assert_cosmetic_access(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert!(
            conduct::get_owner(conduct_status) == sender,
            errors::invalid_owner()
        );

        assert!(
            conduct::get_passport_id(conduct_status) == passport::get_id(passport_obj),
            errors::invalid_owner()
        );

        assert!(
            conduct::has_active_benefits(conduct_status, ctx),
            errors::conduct_restricted()
        );
    }

    // =========================================================
    // CREATE LOADOUT
    // User creates a display object for equipped cosmetics.
    // Black Passport cannot create/loadout-update while restricted.
    // =========================================================
    public fun create_loadout(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);

        assert_cosmetic_access(
            passport_obj,
            conduct_status,
            ctx
        );

        let now = tx_context::epoch_timestamp_ms(ctx);

        let loadout = CosmeticLoadout {
            id: object::new(ctx),

            owner,
            passport_id: passport::get_id(passport_obj),

            profile_frame_code: NONE,
            passport_theme_code: NONE,
            chat_overlay_code: NONE,
            avatar_style_code: NONE,
            badge_display_code: NONE,
            title_effect_code: NONE,

            created_at_ms: now,
            updated_at_ms: now,
        };

        sui::event::emit(CosmeticLoadoutCreated {
            owner,
            passport_id: passport::get_id(passport_obj),
        });

        transfer::transfer(loadout, owner);
    }

    // =========================================================
    // GRANT COSMETIC UNLOCK
    // Package-only.
    // AdminCap currently exposes this through admin.move.
    // =========================================================
    public(package) fun grant_cosmetic_unlock(
        owner: address,
        passport_obj: &passport::Passport,
        cosmetic_type: u8,
        cosmetic_code: u64,
        source_code: u64,
        ctx: &mut TxContext
    ) {
        assert!(
            is_valid_cosmetic_type(cosmetic_type),
            errors::invalid_cosmetic_type()
        );

        let unlock = CosmeticUnlock {
            id: object::new(ctx),
            owner,
            passport_id: passport::get_id(passport_obj),
            cosmetic_type,
            cosmetic_code,
            source_code,
            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
        };

        sui::event::emit(CosmeticUnlocked {
            owner,
            passport_id: passport::get_id(passport_obj),
            cosmetic_type,
            cosmetic_code,
            source_code,
        });

        transfer::transfer(unlock, owner);
    }

    // =========================================================
    // EQUIP COSMETIC
    // Requires an owned CosmeticUnlock proof.
    // =========================================================
    public fun equip_cosmetic(
        loadout: &mut CosmeticLoadout,
        unlock: &CosmeticUnlock,
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert_cosmetic_access(
            passport_obj,
            conduct_status,
            ctx
        );

        assert!(
            loadout.owner == sender,
            errors::invalid_owner()
        );

        assert!(
            unlock.owner == sender,
            errors::invalid_owner()
        );

        assert!(
            loadout.passport_id == passport::get_id(passport_obj),
            errors::invalid_owner()
        );

        assert!(
            unlock.passport_id == passport::get_id(passport_obj),
            errors::invalid_owner()
        );

        assert!(
            is_valid_cosmetic_type(unlock.cosmetic_type),
            errors::invalid_cosmetic_type()
        );

        if (unlock.cosmetic_type == PROFILE_FRAME) {
            loadout.profile_frame_code = unlock.cosmetic_code;
        } else if (unlock.cosmetic_type == PASSPORT_THEME) {
            loadout.passport_theme_code = unlock.cosmetic_code;
        } else if (unlock.cosmetic_type == CHAT_OVERLAY) {
            loadout.chat_overlay_code = unlock.cosmetic_code;
        } else if (unlock.cosmetic_type == AVATAR_STYLE) {
            loadout.avatar_style_code = unlock.cosmetic_code;
        } else if (unlock.cosmetic_type == BADGE_DISPLAY) {
            loadout.badge_display_code = unlock.cosmetic_code;
        } else if (unlock.cosmetic_type == TITLE_EFFECT) {
            loadout.title_effect_code = unlock.cosmetic_code;
        } else {
            abort errors::invalid_cosmetic_type()
        };

        loadout.updated_at_ms = tx_context::epoch_timestamp_ms(ctx);

        sui::event::emit(CosmeticEquipped {
            owner: sender,
            passport_id: passport::get_id(passport_obj),
            cosmetic_type: unlock.cosmetic_type,
            cosmetic_code: unlock.cosmetic_code,
        });
    }

    // =========================================================
    // UNLOCK GETTERS
    // =========================================================
    public fun get_unlock_owner(unlock: &CosmeticUnlock): address {
        unlock.owner
    }

    public fun get_unlock_passport_id(unlock: &CosmeticUnlock): address {
        unlock.passport_id
    }

    public fun get_unlock_type(unlock: &CosmeticUnlock): u8 {
        unlock.cosmetic_type
    }

    public fun get_unlock_code(unlock: &CosmeticUnlock): u64 {
        unlock.cosmetic_code
    }

    public fun get_unlock_source_code(unlock: &CosmeticUnlock): u64 {
        unlock.source_code
    }

    // =========================================================
    // LOADOUT GETTERS
    // =========================================================
    public fun get_loadout_owner(loadout: &CosmeticLoadout): address {
        loadout.owner
    }

    public fun get_loadout_passport_id(loadout: &CosmeticLoadout): address {
        loadout.passport_id
    }

    public fun get_profile_frame_code(loadout: &CosmeticLoadout): u64 {
        loadout.profile_frame_code
    }

    public fun get_passport_theme_code(loadout: &CosmeticLoadout): u64 {
        loadout.passport_theme_code
    }

    public fun get_chat_overlay_code(loadout: &CosmeticLoadout): u64 {
        loadout.chat_overlay_code
    }

    public fun get_avatar_style_code(loadout: &CosmeticLoadout): u64 {
        loadout.avatar_style_code
    }

    public fun get_badge_display_code(loadout: &CosmeticLoadout): u64 {
        loadout.badge_display_code
    }

    public fun get_title_effect_code(loadout: &CosmeticLoadout): u64 {
        loadout.title_effect_code
    }
}