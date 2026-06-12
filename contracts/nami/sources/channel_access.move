module nami::channel_access {

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
    const NPC: u8 = 0;

    // =========================================================
    // CHANNEL ACCESS POLICY OBJECT
    // =========================================================
    public struct ChannelAccessPolicy has key {
        id: UID,

        owner: address,

        channel_id: address,

        allow_npc_chat: bool,

        minimum_tier: u8,

        minimum_reputation: u8,

        created_at_ms: u64,
        updated_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct ChannelAccessPolicyCreated has copy, drop {
        owner: address,
        channel_id: address,
        allow_npc_chat: bool,
        minimum_tier: u8,
        minimum_reputation: u8,
    }

    public struct ChannelAccessRuleUpdated has copy, drop {
        owner: address,
        channel_id: address,
        allow_npc_chat: bool,
        minimum_tier: u8,
        minimum_reputation: u8,
    }

    // =========================================================
    // CREATE POLICY
    // =========================================================
    public fun create_policy(
        channel_id: address,
        allow_npc_chat: bool,
        minimum_tier: u8,
        minimum_reputation: u8,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        let now = tx_context::epoch_timestamp_ms(ctx);

        let policy = ChannelAccessPolicy {
            id: object::new(ctx),
            owner,
            channel_id,
            allow_npc_chat,
            minimum_tier,
            minimum_reputation,
            created_at_ms: now,
            updated_at_ms: now,
        };

        sui::event::emit(ChannelAccessPolicyCreated {
            owner,
            channel_id,
            allow_npc_chat,
            minimum_tier,
            minimum_reputation,
        });

        transfer::transfer(policy, owner);
    }

    // =========================================================
    // UPDATE POLICY
    // =========================================================
    public fun update_policy(
        policy: &mut ChannelAccessPolicy,
        allow_npc_chat: bool,
        minimum_tier: u8,
        minimum_reputation: u8,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert!(
            sender == policy.owner,
            errors::invalid_owner()
        );

        policy.allow_npc_chat = allow_npc_chat;
        policy.minimum_tier = minimum_tier;
        policy.minimum_reputation = minimum_reputation;
        policy.updated_at_ms = tx_context::epoch_timestamp_ms(ctx);

        sui::event::emit(ChannelAccessRuleUpdated {
            owner: sender,
            channel_id: policy.channel_id,
            allow_npc_chat,
            minimum_tier,
            minimum_reputation,
        });
    }

    // =========================================================
    // LEGACY / PACKAGE-ONLY CHAT ACCESS CHECK
    // =========================================================
    // Internal package path without Conduct.
    // Public systems should use conduct-aware functions below.
    // =========================================================
    public(package) fun can_chat(
        passport_obj: &passport::Passport,
        policy: &ChannelAccessPolicy
    ): bool {
        let tier = membership::get_effective_tier(passport_obj);
        let reputation = passport::get_reputation(passport_obj);

        if (tier == NPC && !policy.allow_npc_chat) {
            false
        } else if (tier < policy.minimum_tier) {
            false
        } else if (reputation < policy.minimum_reputation) {
            false
        } else {
            true
        }
    }

    public(package) fun assert_can_chat(
        passport_obj: &passport::Passport,
        policy: &ChannelAccessPolicy
    ) {
        assert!(
            can_chat(passport_obj, policy),
            errors::insufficient_tier()
        );
    }

    // =========================================================
    // CONDUCT-AWARE CHAT ACCESS CHECK
    // =========================================================
    public fun can_chat_with_conduct(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        policy: &ChannelAccessPolicy,
        ctx: &TxContext
    ): bool {
        if (!conduct::has_active_benefits(conduct_status, ctx)) {
            false
        } else {
            let tier = membership::get_effective_tier_with_conduct(
                passport_obj,
                conduct_status,
                ctx
            );

            let reputation = passport::get_reputation(passport_obj);

            if (tier == NPC && !policy.allow_npc_chat) {
                false
            } else if (tier < policy.minimum_tier) {
                false
            } else if (reputation < policy.minimum_reputation) {
                false
            } else {
                true
            }
        }
    }

    public fun assert_can_chat_with_conduct(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        policy: &ChannelAccessPolicy,
        ctx: &TxContext
    ) {
        assert!(
            conduct::has_active_benefits(conduct_status, ctx),
            errors::conduct_restricted()
        );

        assert!(
            can_chat_with_conduct(passport_obj, conduct_status, policy, ctx),
            errors::insufficient_tier()
        );
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_owner(policy: &ChannelAccessPolicy): address {
        policy.owner
    }

    public fun get_channel_id(policy: &ChannelAccessPolicy): address {
        policy.channel_id
    }

    public fun get_allow_npc_chat(policy: &ChannelAccessPolicy): bool {
        policy.allow_npc_chat
    }

    public fun get_minimum_tier(policy: &ChannelAccessPolicy): u8 {
        policy.minimum_tier
    }

    public fun get_minimum_reputation(policy: &ChannelAccessPolicy): u8 {
        policy.minimum_reputation
    }
}