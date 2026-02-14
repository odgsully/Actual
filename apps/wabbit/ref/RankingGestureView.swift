import SwiftUI
import UIKit
import CoreHaptics

// =============================================================================
// RANKING GESTURE VIEW
// UIKit gesture recognizers wrapped for SwiftUI via UIViewRepresentable.
//
// Gesture mapping:
//   - Tap:              Quick score of 5.0, auto-submit
//   - Tap + Drag:       Initial tap = 5.0 anchor. Drag up → 10, drag down → 0
//   - Long Press:       Triggers secondary action (options menu, flag, etc.)
//   - Two-Finger Tap:   Undo last ranking
//
// The vertical drag maps to a 0–10 scale:
//   score = 5.0 + (translationY / maxDragDistance) * -5.0
//   (negative because dragging UP = higher score)
// =============================================================================

struct RankingGestureView: UIViewRepresentable {
    @Binding var score: Double
    @Binding var hasInteracted: Bool
    var onCommit: (Double) -> Void
    
    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }
    
    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .clear
        
        // ── Pan Gesture (primary: tap + drag scoring) ──
        let pan = UIPanGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handlePan(_:)))
        pan.minimumNumberOfTouches = 1
        pan.maximumNumberOfTouches = 1
        view.addGestureRecognizer(pan)
        
        // ── Tap Gesture (quick score = 5.0) ──
        let tap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleTap(_:)))
        tap.numberOfTapsRequired = 1
        tap.numberOfTouchesRequired = 1
        // Tap should only fire if pan doesn't claim the touch
        tap.require(toFail: pan)
        view.addGestureRecognizer(tap)
        
        // ── Long Press (secondary action) ──
        let longPress = UILongPressGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleLongPress(_:)))
        longPress.minimumPressDuration = 0.5
        longPress.numberOfTouchesRequired = 1
        view.addGestureRecognizer(longPress)
        
        // ── Two-Finger Tap (undo) ──
        let twoFingerTap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleTwoFingerTap(_:)))
        twoFingerTap.numberOfTapsRequired = 1
        twoFingerTap.numberOfTouchesRequired = 2
        view.addGestureRecognizer(twoFingerTap)
        
        // Prepare haptics engine
        context.coordinator.prepareHaptics()
        
        return view
    }
    
    func updateUIView(_ uiView: UIView, context: Context) {
        // Coordinator stays in sync via bindings
    }
    
    // =========================================================================
    // COORDINATOR — handles all gesture recognition logic
    // =========================================================================
    
    class Coordinator: NSObject {
        let parent: RankingGestureView
        
        // Maximum drag distance (points) that maps to full 0–10 range
        // Adjust this to tune sensitivity. 300pt feels natural on most iPhones.
        let maxDragDistance: CGFloat = 300.0
        
        // Haptic engine
        private var hapticEngine: CHHapticEngine?
        private var lastHapticScore: Int = 5  // Track integer score for haptic thresholds
        
        init(parent: RankingGestureView) {
            self.parent = parent
        }
        
        // MARK: - Pan (Tap + Drag Scoring)
        
        @objc func handlePan(_ gesture: UIPanGestureRecognizer) {
            switch gesture.state {
            case .began:
                parent.hasInteracted = true
                parent.score = 5.0  // Anchor at 5
                playHaptic(intensity: 0.3)
                
            case .changed:
                let translation = gesture.translation(in: gesture.view)
                
                // Map vertical translation to score offset
                // Drag UP (negative Y) = higher score
                // Drag DOWN (positive Y) = lower score
                let offset = Double(-translation.y / maxDragDistance) * 5.0
                let newScore = min(10.0, max(0.0, 5.0 + offset))
                
                // Round to one decimal for display
                parent.score = (newScore * 10).rounded() / 10
                
                // Haptic feedback at integer boundaries
                let intScore = Int(parent.score.rounded())
                if intScore != lastHapticScore {
                    lastHapticScore = intScore
                    
                    // Stronger haptic at extremes (0, 1, 5, 9, 10)
                    let isKeyScore = [0, 1, 5, 9, 10].contains(intScore)
                    playHaptic(intensity: isKeyScore ? 0.8 : 0.4)
                }
                
            case .ended:
                // Commit the score
                let finalScore = parent.score
                playHaptic(intensity: 0.6)
                parent.onCommit(finalScore)
                
            case .cancelled, .failed:
                parent.score = 5.0
                parent.hasInteracted = false
                
            default:
                break
            }
        }
        
        // MARK: - Tap (Quick Score = 5)
        
        @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            guard gesture.state == .ended else { return }
            parent.hasInteracted = true
            parent.score = 5.0
            playHaptic(intensity: 0.5)
            parent.onCommit(5.0)
        }
        
        // MARK: - Long Press (Secondary Action)
        
        @objc func handleLongPress(_ gesture: UILongPressGestureRecognizer) {
            guard gesture.state == .began else { return }
            playHaptic(intensity: 0.7)
            
            // TODO: Trigger options menu (flag, skip, add note, etc.)
            print("🔵 Long press — show options menu")
        }
        
        // MARK: - Two-Finger Tap (Undo)
        
        @objc func handleTwoFingerTap(_ gesture: UITapGestureRecognizer) {
            guard gesture.state == .ended else { return }
            playHaptic(intensity: 0.5)
            
            // TODO: Undo last ranking
            print("↩️ Two-finger tap — undo last ranking")
        }
        
        // MARK: - Haptics
        
        func prepareHaptics() {
            guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
            
            do {
                hapticEngine = try CHHapticEngine()
                try hapticEngine?.start()
                
                // Auto-restart if engine stops
                hapticEngine?.stoppedHandler = { [weak self] _ in
                    try? self?.hapticEngine?.start()
                }
            } catch {
                print("Haptic engine error: \(error)")
            }
        }
        
        private func playHaptic(intensity: Float) {
            guard let engine = hapticEngine,
                  CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
            
            let sharpness = CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5)
            let intensityParam = CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity)
            
            let event = CHHapticEvent(
                eventType: .hapticTransient,
                parameters: [sharpness, intensityParam],
                relativeTime: 0
            )
            
            do {
                let pattern = try CHHapticPattern(events: [event], parameters: [])
                let player = try engine.makePlayer(with: pattern)
                try player.start(atTime: CHHapticTimeImmediate)
            } catch {
                print("Haptic playback error: \(error)")
            }
        }
    }
}
