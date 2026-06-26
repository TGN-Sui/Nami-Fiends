module nami::chat_overlay_catalog {

    use sui::event;
    use sui::tx_context::TxContext;

    // =========================================================
    // BORDER ART CATALOG ATTESTATION (BA-14.4)
    // Emits a verifiable root for Walrus quilt catalog publishes.
    // =========================================================
    public struct ChatOverlayCatalogPublished has copy, drop {
        official_owner: address,
        catalog_version_ms: u64,
        quilt_blob_id: vector<u8>,
        content_root_hash: vector<u8>,
        patch_count: u64,
    }

    /// Package-only entry; invoked through admin::publish_chat_overlay_catalog.
    public(package) fun publish_catalog_attestation(
        official_owner: address,
        catalog_version_ms: u64,
        quilt_blob_id: vector<u8>,
        content_root_hash: vector<u8>,
        patch_count: u64,
        _ctx: &mut TxContext
    ) {
        event::emit(ChatOverlayCatalogPublished {
            official_owner,
            catalog_version_ms,
            quilt_blob_id,
            content_root_hash,
            patch_count,
        });
    }
}