#[test_only]
module nami::nami_tests {

    use sui::test_scenario;

    use nami::identity;
    use nami::passport;
    use nami::badge;
    use nami::boost;

    /// Test addresses
    const USER: address = @0x1;
    const IDENTITY_ID: address = @0x100;
    const CHANNEL_ID: address = @0x200;

    /// Archetypes
    const ARCHETYPE_EXPLORER: u8 = 1;

    /// Badge types
    const COMPLETION_BADGE: u8 = 3;

    /// Membership tiers
    const NPC: u8 = 0;
    const ADVENTURER: u8 = 1;
    const PRO: u8 = 2;
    const ELITE: u8 = 3;

    /// Reputation tiers
    const NEWBIE: u8 = 0;
    const GAMESTER: u8 = 1;
    const GOBLIN: u8 = 2;
    const GOONIE: u8 = 3;
    const FIEND: u8 = 4;

    /// ---------------------------------------------------------
    /// Identity + Passport creation
    /// ---------------------------------------------------------
    #[test]
    fun test_identity_and_passport_creation() {
        let mut scenario = test_scenario::begin(USER);

        identity::init_identity(test_scenario::ctx(&mut scenario));

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        assert!(passport::get_tier(&passport_obj) == NPC, 0);
        assert!(passport::get_level(&passport_obj) == 1, 1);
        assert!(passport::get_reputation(&passport_obj) == NEWBIE, 2);
        assert!(passport::get_xp(&passport_obj) == 0, 3);
        assert!(passport::get_badge_points(&passport_obj) == 0, 4);
        assert!(passport::get_level_progress(&passport_obj) == 0, 5);
        assert!(passport::get_prestige_points(&passport_obj) == 0, 6);

        test_scenario::return_to_sender(&scenario, identity_obj);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Passport tier upgrade flow:
    /// NPC -> Adventurer -> Pro -> Elite
    /// ---------------------------------------------------------
    #[test]
    fun test_passport_tier_upgrade_flow() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        assert!(passport::get_tier(&passport_obj) == NPC, 10);

        passport::verify_to_adventurer(&mut passport_obj);
        assert!(passport::get_tier(&passport_obj) == ADVENTURER, 11);

        passport::upgrade_to_pro(&mut passport_obj);
        assert!(passport::get_tier(&passport_obj) == PRO, 12);

        passport::upgrade_to_elite(&mut passport_obj);
        assert!(passport::get_tier(&passport_obj) == ELITE, 13);

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Badge minting updates Passport badge points
    /// ---------------------------------------------------------
    #[test]
    fun test_badge_mint_updates_passport_points() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        badge::mint_badge(
            &mut passport_obj,
            USER,
            COMPLETION_BADGE,
            b"completion-badge",
            test_scenario::ctx(&mut scenario)
        );

        assert!(passport::get_badge_points(&passport_obj) == 3, 20);
        assert!(passport::get_xp(&passport_obj) == 3, 21);
        assert!(passport::get_reputation(&passport_obj) == NEWBIE, 22);

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let badge_obj =
            test_scenario::take_from_sender<badge::Badge>(&scenario);

        test_scenario::return_to_sender(&scenario, badge_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Badge point thresholds update reputation using curved model
    /// ---------------------------------------------------------
    #[test]
    fun test_badge_points_update_reputation() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::apply_badge_points(&mut passport_obj, 90);
        assert!(passport::get_reputation(&passport_obj) == GAMESTER, 30);

        passport::apply_badge_points(&mut passport_obj, 335);
        assert!(passport::get_badge_points(&passport_obj) == 425, 31);
        assert!(passport::get_reputation(&passport_obj) == GOBLIN, 32);

        passport::apply_badge_points(&mut passport_obj, 425);
        assert!(passport::get_badge_points(&passport_obj) == 850, 33);
        assert!(passport::get_reputation(&passport_obj) == GOONIE, 34);

        passport::apply_badge_points(&mut passport_obj, 750);
        assert!(passport::get_badge_points(&passport_obj) == 1600, 35);
        assert!(passport::get_reputation(&passport_obj) == FIEND, 36);

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// NPC cannot boost
    /// Expected abort code:
    /// boost_unavailable = 60
    /// ---------------------------------------------------------
    #[test, expected_failure(abort_code = 60)]
    fun test_npc_cannot_boost() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        boost::use_boost(
            &passport_obj,
            CHANNEL_ID,
            1,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Adventurer can boost
    /// ---------------------------------------------------------
    #[test]
    fun test_adventurer_can_boost() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::verify_to_adventurer(&mut passport_obj);

        boost::use_boost(
            &passport_obj,
            CHANNEL_ID,
            1,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let boost_obj =
            test_scenario::take_from_sender<boost::Boost>(&scenario);

        test_scenario::return_to_sender(&scenario, boost_obj);

        test_scenario::end(scenario);
    }
}