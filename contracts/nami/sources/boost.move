module nami::boost {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::errors;
    use nami::membership;
    use nami::passport;

    // =========================================================
    // MEMBERSHIP TIERS
    // =========================================================
    const ADVENTURER: u8 = 1;
    const PRO: u8 = 2;
    const ELITE: u8 = 3;

    // =========================================================
    // BOOST OBJECT
    // =========================================================
    public struct Boost has key {
        id: UID,

        owner: address,

        channel_id: address,

        /// Current model:
        /// Adventurer = 2
        /// Pro = 6
        /// Elite = 8
        power: u8,

        /// Weekly cycle identifier.
        /// Enforcement will be added in the membership/boost authority layer.
        week_id: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct BoostUsed has copy, drop {
        owner: address,
        channel_id: address,
        power: u8,
        tier: u8,
        week_id: u64,
    }

    // =========================================================
    // BOOST POWER RESOLUTION
    // =========================================================
    fun resolve_boost_power(tier: u8): u8 {
        if (tier == ADVENTURER) {
            2
        } else if (tier == PRO) {
            6
        } else if (tier == ELITE) {
            8
        } else {
            abort errors::boost_unavailable()
        }
    }

    // =========================================================
    // INTERNAL BOOST CREATION
    // =========================================================
    fun create_boost(
        owner: address,
        tier: u8,
        channel_id: address,
        week_id: u64,
        ctx: &mut TxContext
    ): Boost {
        let power = resolve_boost_power(tier);

        Boost {
            id: object::new(ctx),
            owner,
            channel_id,
            power,
            week_id,
        }
    }

    // =========================================================
    // USE BOOST
    // NPC cannot boost because NPC resolves to boost_unavailable.
    //
    // Boost now reads effective tier through membership.move so future
    // expiration and Black Passport restrictions can be added cleanly.
    // =========================================================
    public fun use_boost(
        passport_obj: &passport::Passport,
        channel_id: address,
        week_id: u64,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);

        let tier = membership::get_effective_tier(passport_obj);

        let boost = create_boost(
            owner,
            tier,
            channel_id,
            week_id,
            ctx
        );

        sui::event::emit(BoostUsed {
            owner,
            channel_id,
            power: boost.power,
            tier,
            week_id,
        });

        transfer::transfer(boost, owner);
    }
}