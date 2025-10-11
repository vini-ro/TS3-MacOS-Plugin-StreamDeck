import { ClientQueryService } from "./ClientQueryService";

/**
 * Singleton instance manager for ClientQueryService
 * Ensures all actions share the same connection to TeamSpeak
 */
class ClientQueryManager {
	private static instance: ClientQueryService | null = null;

	/**
	 * Get the singleton ClientQuery instance
	 */
	static getInstance(): ClientQueryService {
		if (!ClientQueryManager.instance) {
			ClientQueryManager.instance = new ClientQueryService();
		}
		return ClientQueryManager.instance;
	}

	/**
	 * Reset the singleton instance (useful for testing)
	 */
	static reset(): void {
		if (ClientQueryManager.instance) {
			ClientQueryManager.instance.disconnect();
			ClientQueryManager.instance = null;
		}
	}
}

export default ClientQueryManager;
