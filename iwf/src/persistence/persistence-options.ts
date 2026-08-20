/**
 * Workflow-level persistence options. Currently controls whether data attributes are cached in
 * the workflow memo for high-throughput reads.
 */
export class PersistenceOptions {
    public readonly enableCaching: boolean;

    constructor(enableCaching = false) {
        this.enableCaching = enableCaching;
    }

    public static getDefault(): PersistenceOptions {
        return new PersistenceOptions(false);
    }
}
