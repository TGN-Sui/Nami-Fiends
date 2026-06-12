module nami::recovery {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::errors;
    use nami::identity;
    use nami::passport;

    // =========================================================
    // RECOVERY STATUS
    // =========================================================
    const STATUS_OPEN: u8 = 1;
    const STATUS_APPROVED: u8 = 2;
    const STATUS_DENIED: u8 = 3;
    const STATUS_MODIFIED: u8 = 4;

    // =========================================================
    // RECOVERY REQUEST OBJECT
    // =========================================================
    public struct RecoveryRequest has key {
        id: UID,

        requester: address,

        identity_id: address,
        passport_id: address,

        current_owner: address,
        requested_new_owner: address,

        status: u8,

        /// Public reference only.
        /// Do not store private recovery evidence directly on-chain.
        public_reference: vector<u8>,

        resolution_code: u64,

        created_at_ms: u64,
        resolved_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct RecoveryRequested has copy, drop {
        recovery_id: address,
        requester: address,
        identity_id: address,
        passport_id: address,
        current_owner: address,
        requested_new_owner: address,
    }

    public struct RecoveryResolved has copy, drop {
        recovery_id: address,
        requester: address,
        identity_id: address,
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
    // OPEN RECOVERY REQUEST
    // MVP-safe version:
    // - Links Identity + Passport
    // - Records requested new owner
    // - Does NOT transfer ownership
    //
    // Private evidence should live off-chain or encrypted.
    // =========================================================
    public fun open_recovery_request(
        identity_obj: &identity::Identity,
        passport_obj: &passport::Passport,
        requested_new_owner: address,
        public_reference: vector<u8>,
        ctx: &mut TxContext
    ) {
        let requester = tx_context::sender(ctx);
        let identity_id = identity::get_id(identity_obj);
        let passport_id = passport::get_id(passport_obj);
        let current_owner = identity::get_owner(identity_obj);

        assert!(
            passport::get_identity_id(passport_obj) == identity_id,
            errors::invalid_recovery_request()
        );

        assert!(
            requested_new_owner != @0x0,
            errors::invalid_recovery_request()
        );

        let request = RecoveryRequest {
            id: object::new(ctx),

            requester,

            identity_id,
            passport_id,

            current_owner,
            requested_new_owner,

            status: STATUS_OPEN,

            public_reference,

            resolution_code: 0,

            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
            resolved_at_ms: 0,
        };

        let recovery_id = object::uid_to_address(&request.id);

        sui::event::emit(RecoveryRequested {
            recovery_id,
            requester,
            identity_id,
            passport_id,
            current_owner,
            requested_new_owner,
        });

        transfer::transfer(request, requester);
    }

    // =========================================================
    // RESOLVE RECOVERY REQUEST
    // Package-only. Exposed through admin.move.
    // Does not mutate Identity or Passport ownership yet.
    // =========================================================
    public(package) fun resolve_recovery_request(
        request: &mut RecoveryRequest,
        result_status: u8,
        resolution_code: u64,
        ctx: &TxContext
    ) {
        assert!(
            request.status == STATUS_OPEN,
            errors::recovery_already_resolved()
        );

        assert!(
            is_valid_result_status(result_status),
            errors::invalid_recovery_result()
        );

        request.status = result_status;
        request.resolution_code = resolution_code;
        request.resolved_at_ms = tx_context::epoch_timestamp_ms(ctx);

        sui::event::emit(RecoveryResolved {
            recovery_id: object::uid_to_address(&request.id),
            requester: request.requester,
            identity_id: request.identity_id,
            passport_id: request.passport_id,
            result_status,
            resolution_code,
        });
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_id(request: &RecoveryRequest): address {
        object::uid_to_address(&request.id)
    }

    public fun get_requester(request: &RecoveryRequest): address {
        request.requester
    }

    public fun get_identity_id(request: &RecoveryRequest): address {
        request.identity_id
    }

    public fun get_passport_id(request: &RecoveryRequest): address {
        request.passport_id
    }

    public fun get_current_owner(request: &RecoveryRequest): address {
        request.current_owner
    }

    public fun get_requested_new_owner(request: &RecoveryRequest): address {
        request.requested_new_owner
    }

    public fun get_status(request: &RecoveryRequest): u8 {
        request.status
    }

    public fun get_resolution_code(request: &RecoveryRequest): u64 {
        request.resolution_code
    }

    public fun is_open(request: &RecoveryRequest): bool {
        request.status == STATUS_OPEN
    }

    public fun is_approved(request: &RecoveryRequest): bool {
        request.status == STATUS_APPROVED
    }

    public fun is_denied(request: &RecoveryRequest): bool {
        request.status == STATUS_DENIED
    }

    public fun is_modified(request: &RecoveryRequest): bool {
        request.status == STATUS_MODIFIED
    }
}