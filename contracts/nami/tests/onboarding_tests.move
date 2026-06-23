#[test_only]
module nami::onboarding_tests {

    use sui::test_scenario;

    use nami::badge;
    use nami::identity;
    use nami::onboarding;
    use nami::passport;
    use nami::profile;

    const USER: address = @0x1;
    const OTHER: address = @0x2;
    const ARCHETYPE_EXPLORER: u8 = 1;
    const NEWBIE: u8 = 0;

    fun share_registry(scenario: &mut test_scenario::Scenario) {
        onboarding::share_registry_for_testing(test_scenario::ctx(scenario));
    }

    #[test]
    fun test_enter_nami_mints_anchor_identity_profile_and_badge() {
        let mut scenario = test_scenario::begin(USER);
        share_registry(&mut scenario);

        test_scenario::next_tx(&mut scenario, USER);

        let mut registry =
            test_scenario::take_shared<onboarding::NodenameRegistry>(&scenario);

        onboarding::enter_nami(
            &mut registry,
            b"fiendgamer",
            ARCHETYPE_EXPLORER,
            b"seed:NA",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_shared(registry);

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);
        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);
        let profile_obj =
            test_scenario::take_from_sender<profile::Profile>(&scenario);
        let badge_obj =
            test_scenario::take_from_sender<badge::Badge>(&scenario);

        assert!(identity::get_owner(&identity_obj) == USER, 0);
        assert!(identity::get_nodename(&identity_obj) == b"fiendgamer", 1);
        assert!(identity::has_nodename(&identity_obj), 2);
        assert!(
            passport::get_identity_id(&passport_obj) == identity::get_id(&identity_obj),
            3
        );
        assert!(passport::get_level(&passport_obj) == 0, 4);
        assert!(passport::get_xp(&passport_obj) == 0, 5);
        assert!(passport::get_badge_points(&passport_obj) == 0, 6);
        assert!(passport::get_archetype(&passport_obj) == ARCHETYPE_EXPLORER, 7);
        assert!(passport::get_reputation(&passport_obj) == NEWBIE, 8);
        assert!(profile::get_display_name(&profile_obj) == vector[], 9);
        assert!(profile::get_avatar_ref(&profile_obj) == b"seed:NA", 10);

        let identity_id = identity::get_id(&identity_obj);

        test_scenario::return_to_sender(&scenario, identity_obj);
        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, profile_obj);
        test_scenario::return_to_sender(&scenario, badge_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let registry =
            test_scenario::take_shared<onboarding::NodenameRegistry>(&scenario);

        assert!(onboarding::has_nodename(&registry, b"fiendgamer"), 11);
        assert!(onboarding::has_owner(&registry, USER), 12);
        assert!(
            onboarding::resolve_identity_for_nodename(&registry, b"fiendgamer")
                == identity_id,
            13
        );

        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }

    #[test, expected_failure(abort_code = 172)]
    fun test_enter_nami_rejects_duplicate_owner() {
        let mut scenario = test_scenario::begin(USER);
        share_registry(&mut scenario);

        test_scenario::next_tx(&mut scenario, USER);

        let mut registry =
            test_scenario::take_shared<onboarding::NodenameRegistry>(&scenario);

        onboarding::enter_nami(
            &mut registry,
            b"fiendgamer",
            ARCHETYPE_EXPLORER,
            b"seed:NA",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_shared(registry);

        test_scenario::next_tx(&mut scenario, USER);

        let mut registry =
            test_scenario::take_shared<onboarding::NodenameRegistry>(&scenario);

        onboarding::enter_nami(
            &mut registry,
            b"fiendpro",
            ARCHETYPE_EXPLORER,
            b"seed:NB",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }

    #[test, expected_failure(abort_code = 171)]
    fun test_enter_nami_rejects_duplicate_nodename() {
        let mut scenario = test_scenario::begin(USER);
        share_registry(&mut scenario);

        test_scenario::next_tx(&mut scenario, USER);

        let mut registry =
            test_scenario::take_shared<onboarding::NodenameRegistry>(&scenario);

        onboarding::enter_nami(
            &mut registry,
            b"fiendgamer",
            ARCHETYPE_EXPLORER,
            b"seed:NA",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_shared(registry);

        test_scenario::next_tx(&mut scenario, OTHER);

        let mut registry =
            test_scenario::take_shared<onboarding::NodenameRegistry>(&scenario);

        onboarding::enter_nami(
            &mut registry,
            b"fiendgamer",
            ARCHETYPE_EXPLORER,
            b"seed:NC",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }

    #[test, expected_failure(abort_code = 170)]
    fun test_enter_nami_rejects_invalid_prefix() {
        let mut scenario = test_scenario::begin(USER);
        share_registry(&mut scenario);

        test_scenario::next_tx(&mut scenario, USER);

        let mut registry =
            test_scenario::take_shared<onboarding::NodenameRegistry>(&scenario);

        onboarding::enter_nami(
            &mut registry,
            b"namigamer",
            ARCHETYPE_EXPLORER,
            b"seed:NA",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }
}