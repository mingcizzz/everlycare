import Foundation

/// Minimal URLSession-based client for writing care logs directly to Supabase from the widget extension.
/// Does NOT depend on any RN or Expo code — uses only Foundation.
struct SupabaseClient {
    let supabaseUrl: String
    let accessToken: String

    // MARK: - Insert care log

    func insertCareLog(
        recipientId: String,
        loggedBy: String,
        logType: String,
        data: [String: Any]
    ) async throws {
        guard let url = URL(string: "\(supabaseUrl)/rest/v1/care_logs") else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 12

        request.setValue("application/json",    forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("return=minimal",      forHTTPHeaderField: "Prefer")

        // Encode the inner `data` JSONB field
        let dataJsonData = try JSONSerialization.data(withJSONObject: data)
        guard let dataJsonString = String(data: dataJsonData, encoding: .utf8) else {
            throw URLError(.cannotDecodeRawData)
        }

        // Top-level row
        let row: [String: Any] = [
            "care_recipient_id": recipientId,
            "logged_by":         loggedBy,
            "log_type":          logType,
            "occurred_at":       iso8601Now(),
            "data":              dataJsonString,
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: row)

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse,
              (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }

    // MARK: - Helpers

    private func iso8601Now() -> String {
        let fmt = ISO8601DateFormatter()
        fmt.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return fmt.string(from: Date())
    }
}
