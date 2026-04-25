import SwiftUI
import WidgetKit

// MARK: - Medium 4×2 widget

struct MediumWidgetEntryView: View {
    let entry: EverlyCareTimelineEntry

    private var data: WidgetEntry { entry.widgetEntry }
    private var isZh: Bool { data.isZh }
    private var isCountdown: Bool { entry.countdownSecondsRemaining != nil }

    private var urgencyColor: Color { Color(hex: data.urgency.hexColor) }

    private var countdownText: String {
        guard let secs = entry.countdownSecondsRemaining else { return "" }
        let m = secs / 60; let s = secs % 60
        return String(format: "%d:%02d", m, s)
    }

    private var predictionLabel: String {
        guard let predicted = data.predictedAt else {
            return isZh ? "暂无预测" : "No prediction"
        }
        let diff = Int(predicted.timeIntervalSinceNow / 60)
        if diff > 0  { return isZh ? "约 \(diff) 分钟后如厕" : "Toilet in ~\(diff) min" }
        if diff == 0 { return isZh ? "现在带去如厕" : "Time to go now!" }
        return isZh ? "如厕已超时 \(abs(diff)) 分" : "Overdue \(abs(diff)) min"
    }

    // ── Body ──────────────────────────────────────────────────────────────
    var body: some View {
        ZStack {
            Color(hex: "#064E3B")
            VStack(spacing: 0) {
                HStack(spacing: 0) {
                    leftPanel
                        .frame(maxWidth: .infinity)
                    Rectangle()
                        .fill(Color(hex: "#065F46"))
                        .frame(width: 1)
                        .padding(.vertical, 12)
                    rightPanel
                        .frame(maxWidth: .infinity)
                }
                Divider()
                    .background(Color(hex: "#065F46"))
                actionBar
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
            }
        }
        .widgetBackground(Color(hex: "#064E3B"))
    }

    // ── Left: prediction or countdown ────────────────────────────────────

    private var leftPanel: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Text("🚽")
                    .font(.system(size: 12))
                Text(isZh ? "如厕预测" : "Next Toilet")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(Color(hex: "#A7F3D0"))
            }

            Spacer()

            if isCountdown {
                Text(isZh ? "💧 坐够时间中" : "💧 Seated Timer")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Color(hex: "#A7F3D0"))
                Text(countdownText)
                    .font(.system(size: 28, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
            } else {
                Text(predictionLabel)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(data.urgency == .overdue ? Color(hex: "#EF4444") : .white)
                    .minimumScaleFactor(0.55)
                    .lineLimit(2)

                if let start = data.windowStart, let end = data.windowEnd {
                    let fmt = DateFormatter()
                    let _ = { fmt.dateFormat = "HH:mm" }()
                    Text("\(fmt.string(from: start))–\(fmt.string(from: end))")
                        .font(.system(size: 10))
                        .foregroundColor(Color(hex: "#6EE7B7"))
                }

                // Confidence dots
                HStack(spacing: 3) {
                    ForEach(0..<3, id: \.self) { i in
                        Circle()
                            .fill(Double(i) < data.confidence * 3 ? urgencyColor : Color(hex: "#065F46"))
                            .frame(width: 5, height: 5)
                    }
                }
            }
            Spacer()
        }
        .padding(12)
    }

    // ── Right: daily summary ──────────────────────────────────────────────

    private var rightPanel: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(isZh ? "今日" : "Today")
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(Color(hex: "#A7F3D0"))
                .padding(.bottom, 6)

            statRow(emoji: "💧", count: data.urinationCount, label: isZh ? "排尿" : "Urination")
            statRow(emoji: "💩", count: data.bowelCount,     label: isZh ? "排便" : "Bowel")

            if data.accidentCount > 0 {
                statRow(emoji: "⚠️", count: data.accidentCount,
                        label: isZh ? "意外" : "Accident",
                        countColor: Color(hex: "#EF4444"))
            }

            Spacer()

            if data.medicationTotal > 0 {
                medRow
            }
        }
        .padding(12)
    }

    private func statRow(emoji: String, count: Int, label: String,
                         countColor: Color = .white) -> some View {
        HStack(spacing: 5) {
            Text(emoji).font(.system(size: 12))
            Text("\(count)")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(countColor)
            Text(label)
                .font(.system(size: 10))
                .foregroundColor(Color(hex: "#6EE7B7"))
            Spacer()
        }
        .padding(.vertical, 1)
    }

    private var medRow: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 3) {
                Text("💊").font(.system(size: 10))
                Text(isZh
                     ? "用药 \(data.medicationDone)/\(data.medicationTotal)"
                     : "Meds \(data.medicationDone)/\(data.medicationTotal)")
                    .font(.system(size: 10))
                    .foregroundColor(Color(hex: "#A7F3D0"))
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color(hex: "#065F46")).frame(height: 4)
                    let pct = data.medicationTotal > 0
                        ? CGFloat(data.medicationDone) / CGFloat(data.medicationTotal) : 0
                    Capsule()
                        .fill(Color(hex: "#34D399"))
                        .frame(width: geo.size.width * pct, height: 4)
                }
            }
            .frame(height: 4)
        }
    }

    // ── Action bar (bottom row of buttons) ───────────────────────────────

    @ViewBuilder
    private var actionBar: some View {
        if #available(iOS 17.0, *) {
            if isCountdown {
                // Full-width "Done early" button
                Button(intent: CancelTimerIntent()) {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.circle.fill").font(.system(size: 12))
                        Text(isZh ? "完成，立即记录" : "Done — Log Now").font(.system(size: 12, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .foregroundColor(.white)
                    .background(Color(hex: "#059669"))
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            } else {
                HStack(spacing: 6) {
                    // Timed urination
                    Button(intent: LogUrinationTimedIntent()) {
                        buttonLabel(icon: "timer",      text: isZh ? "计时记录" : "Timer",  bg: "#065F46")
                    }.buttonStyle(.plain)

                    // Direct urination
                    Button(intent: LogUrinationDirectIntent()) {
                        buttonLabel(icon: "bolt.fill",  text: isZh ? "直接记录" : "Log",    bg: data.urgency.hexColor, bgOpacity: 0.85)
                    }.buttonStyle(.plain)

                    // Bowel
                    Button(intent: LogBowelIntent()) {
                        buttonLabel(icon: "toilet.fill", text: isZh ? "大解" : "Bowel", bg: "#78350F", bgOpacity: 0.7)
                    }.buttonStyle(.plain)

                    // Fluid 200 ml
                    Button(intent: LogFluidIntent(amountMl: 200)) {
                        buttonLabel(icon: "cup.and.saucer.fill", text: "200ml", bg: "#1E40AF", bgOpacity: 0.7)
                    }.buttonStyle(.plain)
                }
            }
        }
    }

    private func buttonLabel(icon: String, text: String, bg: String, bgOpacity: Double = 1.0) -> some View {
        VStack(spacing: 2) {
            Image(systemName: icon)
                .font(.system(size: 12))
                .foregroundColor(.white)
            Text(text)
                .font(.system(size: 9, weight: .bold))
                .foregroundColor(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 5)
        .background(Color(hex: bg).opacity(bgOpacity))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
