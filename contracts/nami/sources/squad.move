module nami::squad {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::conduct;
    use nami::errors;
    use nami::membership;
    use nami::passport;

    // =========================================================
    // MEMBERSHIP TIERS
    // =========================================================
    const PRO: u8 = 2;
    const ELITE: u8 = 3;

    // =========================================================
    // SQUAD LIMITS
    // =========================================================
    const PRO_SQUAD_SLOTS: u64 = 2;
    const ELITE_SQUAD_SLOTS: u64 = 3;

    // =========================================================
    // SQUAD OBJECT
    // =========================================================
    public struct Squad has key {
        id: UID,

        owner: address,
        owner_passport_id: address,

        name: vector<u8>,

        max_slots: u64,
        member_count: u64,

        created_at_ms: u64,
    }

    // =========================================================
    // SQUAD MEMBER / SPONSORSHIP OBJECT
    // =========================================================
    public struct SquadMember has key {
        id: UID,

        squad_id: address,
        sponsor: address,
        member: address,

        created_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct SquadCreated has copy, drop {
        squad_id: address,
        owner: address,
        owner_passport_id: address,
        max_slots: u64,
    }

    public struct SquadMemberSponsored has copy, drop {
        squad_id: address,
        sponsor: address,
        member: address,
    }

    // =========================================================
    // HELPERS
    // =========================================================
    fun max_slots_for_tier(tier: u8): u64 {
        if (tier == PRO) {
            PRO_SQUAD_SLOTS
        } else if (tier == ELITE) {
            ELITE_SQUAD_SLOTS
        } else {
            abort errors::insufficient_tier()
        }
    }

    fun assert_can_use_squad_benefits(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        ctx: &TxContext
    ): u8 {
        let sender = tx_context::sender(ctx);

        assert!(
            conduct::get_owner(conduct_status) == sender,
            errors::invalid_owner()
        );

        assert!(
            conduct::get_passport_id(conduct_status) == passport::get_id(passport_obj),
            errors::invalid_owner()
        );

        let tier = membership::get_effective_tier_with_conduct(
            passport_obj,
            conduct_status,
            ctx
        );

        assert!(
            tier == PRO || tier == ELITE,
            errors::insufficient_tier()
        );

        tier
    }

    // =========================================================
    // CREATE SQUAD
    // Pro and Elite only.
    // Black Passport is blocked through effective tier.
    // =========================================================
    public fun create_squad(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        name: vector<u8>,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);

        let tier = assert_can_use_squad_benefits(
            passport_obj,
            conduct_status,
            ctx
        );

        let max_slots = max_slots_for_tier(tier);

        let squad = Squad {
            id: object::new(ctx),
            owner,
            owner_passport_id: passport::get_id(passport_obj),
            name,
            max_slots,
            member_count: 0,
            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
        };

        let squad_id = object::uid_to_address(&squad.id);

        sui::event::emit(SquadCreated {
            squad_id,
            owner,
            owner_passport_id: passport::get_id(passport_obj),
            max_slots,
        });

        transfer::transfer(squad, owner);
    }

    // =========================================================
    // SPONSOR MEMBER
    // Squad owner can sponsor another member into the Squad.
    // Sponsored users receive a SquadMember proof object.
    // =========================================================
    public fun sponsor_member(
        squad: &mut Squad,
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        member: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

              assert!(
            sender == squad.owner,
            errors::squad_unauthorized()
        );

        assert!(
            squad.owner_passport_id == passport::get_id(passport_obj),
            errors::invalid_owner()
        );

        assert_can_use_squad_benefits(
            passport_obj,
            conduct_status,
            ctx
        );
        
        assert!(
            squad.member_count < squad.max_slots,
            errors::squad_limit_reached()
        );

        squad.member_count = squad.member_count + 1;

        let squad_id = object::uid_to_address(&squad.id);

        let member_record = SquadMember {
            id: object::new(ctx),
            squad_id,
            sponsor: sender,
            member,
            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
        };

        sui::event::emit(SquadMemberSponsored {
            squad_id,
            sponsor: sender,
            member,
        });

        transfer::transfer(member_record, member);
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_id(squad: &Squad): address {
        object::uid_to_address(&squad.id)
    }

    public fun get_owner(squad: &Squad): address {
        squad.owner
    }

    public fun get_owner_passport_id(squad: &Squad): address {
        squad.owner_passport_id
    }

    public fun get_name(squad: &Squad): vector<u8> {
        squad.name
    }

    public fun get_max_slots(squad: &Squad): u64 {
        squad.max_slots
    }

    public fun get_member_count(squad: &Squad): u64 {
        squad.member_count
    }

    public fun get_member_squad_id(member: &SquadMember): address {
        member.squad_id
    }

    public fun get_member_sponsor(member: &SquadMember): address {
        member.sponsor
    }

    public fun get_member_address(member: &SquadMember): address {
        member.member
    }
}