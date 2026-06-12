module nami::title {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::conduct;
    use nami::errors;
    use nami::passport;

    // =========================================================
    // TITLE TYPES
    // =========================================================
    const TITLE_GAMESTER: u8 = 1;
    const TITLE_GOBLIN: u8 = 2;
    const TITLE_GOONIE: u8 = 3;
    const TITLE_FIEND: u8 = 4;

    // =========================================================
    // REPUTATION TIERS
    // =========================================================
    const GAMESTER: u8 = 1;
    const GOBLIN: u8 = 2;
    const GOONIE: u8 = 3;
    const FIEND: u8 = 4;

    // =========================================================
    // TITLE DISPLAY DEFAULT
    // =========================================================
    const NO_TITLE: u8 = 0;

    // =========================================================
    // EARNED TITLE OBJECT
    // =========================================================
    public struct EarnedTitle has key {
        id: UID,

        owner: address,
        passport_id: address,

        title_type: u8,

        /// Future hook for season, badge, guild, event, or prestige source.
        source_code: u64,

        created_at_ms: u64,
    }

    // =========================================================
    // TITLE DISPLAY OBJECT
    // =========================================================
    public struct TitleDisplay has key {
        id: UID,

        owner: address,
        passport_id: address,

        /// 0 means no title equipped.
        equipped_title_type: u8,

        created_at_ms: u64,
        updated_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct TitleClaimed has copy, drop {
        owner: address,
        passport_id: address,
        title_type: u8,
        source_code: u64,
    }

    public struct TitleDisplayCreated has copy, drop {
        owner: address,
        passport_id: address,
    }

    public struct TitleEquipped has copy, drop {
        owner: address,
        passport_id: address,
        title_type: u8,
    }

    // =========================================================
    // HELPERS
    // =========================================================
    fun required_reputation_for_title(title_type: u8): u8 {
        if (title_type == TITLE_GAMESTER) {
            GAMESTER
        } else if (title_type == TITLE_GOBLIN) {
            GOBLIN
        } else if (title_type == TITLE_GOONIE) {
            GOONIE
        } else if (title_type == TITLE_FIEND) {
            FIEND
        } else {
            abort errors::invalid_title_type()
        }
    }

    fun assert_title_access(
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
    // CREATE TITLE DISPLAY
    // One display object represents the user's currently equipped title.
    // =========================================================
    public fun create_title_display(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);

        assert_title_access(
            passport_obj,
            conduct_status,
            ctx
        );

        let now = tx_context::epoch_timestamp_ms(ctx);

        let display = TitleDisplay {
            id: object::new(ctx),
            owner,
            passport_id: passport::get_id(passport_obj),
            equipped_title_type: NO_TITLE,
            created_at_ms: now,
            updated_at_ms: now,
        };

        sui::event::emit(TitleDisplayCreated {
            owner,
            passport_id: passport::get_id(passport_obj),
        });

        transfer::transfer(display, owner);
    }

    // =========================================================
    // CLAIM REPUTATION TITLE
    // Users can claim title proofs based on Passport reputation.
    // Black Passport cannot claim new titles while restricted.
    // =========================================================
    public fun claim_reputation_title(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        title_type: u8,
        source_code: u64,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);

        assert_title_access(
            passport_obj,
            conduct_status,
            ctx
        );

        let required_reputation = required_reputation_for_title(title_type);

        assert!(
            passport::get_reputation(passport_obj) >= required_reputation,
            errors::title_not_earned()
        );

        let earned_title = EarnedTitle {
            id: object::new(ctx),
            owner,
            passport_id: passport::get_id(passport_obj),
            title_type,
            source_code,
            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
        };

        sui::event::emit(TitleClaimed {
            owner,
            passport_id: passport::get_id(passport_obj),
            title_type,
            source_code,
        });

        transfer::transfer(earned_title, owner);
    }

    // =========================================================
    // EQUIP TITLE
    // Requires an owned EarnedTitle proof.
    // =========================================================
    public fun equip_title(
        display: &mut TitleDisplay,
        earned_title: &EarnedTitle,
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert_title_access(
            passport_obj,
            conduct_status,
            ctx
        );

        assert!(
            display.owner == sender,
            errors::invalid_owner()
        );

        assert!(
            earned_title.owner == sender,
            errors::invalid_owner()
        );

        assert!(
            display.passport_id == passport::get_id(passport_obj),
            errors::invalid_owner()
        );

        assert!(
            earned_title.passport_id == passport::get_id(passport_obj),
            errors::invalid_owner()
        );

        display.equipped_title_type = earned_title.title_type;
        display.updated_at_ms = tx_context::epoch_timestamp_ms(ctx);

        sui::event::emit(TitleEquipped {
            owner: sender,
            passport_id: passport::get_id(passport_obj),
            title_type: earned_title.title_type,
        });
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_title_owner(earned_title: &EarnedTitle): address {
        earned_title.owner
    }

    public fun get_title_passport_id(earned_title: &EarnedTitle): address {
        earned_title.passport_id
    }

    public fun get_title_type(earned_title: &EarnedTitle): u8 {
        earned_title.title_type
    }

    public fun get_title_source_code(earned_title: &EarnedTitle): u64 {
        earned_title.source_code
    }

    public fun get_display_owner(display: &TitleDisplay): address {
        display.owner
    }

    public fun get_display_passport_id(display: &TitleDisplay): address {
        display.passport_id
    }

    public fun get_equipped_title_type(display: &TitleDisplay): u8 {
        display.equipped_title_type
    }

    public fun has_equipped_title(display: &TitleDisplay): bool {
        display.equipped_title_type != NO_TITLE
    }

     
}
