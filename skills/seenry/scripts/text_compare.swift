// Optional macOS text geometry check for equal-scale reference screenshots.
// Diagnostic: swift text_compare.swift source.png output.png
// Named tolerance check: swift text_compare.swift source.png output.png labels.json
// labels.json: {"labels":[{"name":"headline","text":"Create Music","tolerancePx":9}]}
import AppKit
import CryptoKit
import Foundation
import Vision

struct Label: Decodable {
    let name: String
    let text: String
    let tolerancePx: Double
}
struct Configuration: Decodable { let labels: [Label] }
struct Box: Encodable {
    let x: Int
    let y: Int
    let width: Int
    let height: Int
}
struct Observation: Encodable {
    let text: String
    let confidence: Float
    let box: Box
}
struct Comparison: Encodable {
    let name: String
    let expectedText: String
    let tolerancePx: Double
    let source: Observation?
    let output: Observation?
    let delta: Box?
    let invalidReason: String?
    let withinTolerance: Bool
}
struct ImageRecord: Encodable {
    let path: String
    let sha256: String
    let width: Int
    let height: Int
}
struct Report: Encodable {
    let source: ImageRecord
    let output: ImageRecord
    let comparisons: [Comparison]
}
struct InventoryLine: Encodable {
    let text: String
    let source: Observation?
    let output: Observation?
    let delta: Box?
    let status: String
}
struct InventoryReport: Encodable {
    let mode = "diagnostic"
    let verdict = "unverified"
    let source: ImageRecord
    let output: ImageRecord
    let lines: [InventoryLine]
}

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data((message + "\n").utf8))
    exit(2)
}
guard CommandLine.arguments.count == 3 || CommandLine.arguments.count == 4 else {
    fail("Usage: swift text_compare.swift SOURCE OUTPUT [LABELS.json]")
}
let sourceURL = URL(fileURLWithPath: CommandLine.arguments[1]).standardizedFileURL
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2]).standardizedFileURL

func inspect(_ url: URL) -> (ImageRecord, [Observation]) {
    guard let data = try? Data(contentsOf: url),
          let image = NSImage(data: data),
          let tiff = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let cgImage = bitmap.cgImage else { fail("Cannot open image: \(url.path)") }
    let record = ImageRecord(path: url.path,
                             sha256: SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined(),
                             width: cgImage.width, height: cgImage.height)
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    do { try VNImageRequestHandler(cgImage: cgImage).perform([request]) }
    catch { fail("OCR failed for \(url.path): \(error)") }
    let observations = (request.results ?? []).compactMap { result -> Observation? in
        guard let candidate = result.topCandidates(1).first else { return nil }
        let rectangle = result.boundingBox
        return Observation(text: candidate.string, confidence: candidate.confidence,
                           box: Box(x: Int((rectangle.minX * Double(record.width)).rounded()),
                                    y: Int(((1 - rectangle.maxY) * Double(record.height)).rounded()),
                                    width: Int((rectangle.width * Double(record.width)).rounded()),
                                    height: Int((rectangle.height * Double(record.height)).rounded())))
    }
    return (record, observations)
}
func normalized(_ text: String) -> String {
    text.split(whereSeparator: { $0.isWhitespace }).joined(separator: " ").lowercased()
}
let (sourceRecord, sourceObservations) = inspect(sourceURL)
let (outputRecord, outputObservations) = inspect(outputURL)
guard sourceRecord.width == outputRecord.width, sourceRecord.height == outputRecord.height else {
    fail("Images must have identical physical dimensions")
}
func delta(_ source: Observation, _ output: Observation) -> Box {
    Box(x: output.box.x - source.box.x, y: output.box.y - source.box.y,
        width: output.box.width - source.box.width,
        height: output.box.height - source.box.height)
}
func emit<T: Encodable>(_ report: T) {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    do {
        FileHandle.standardOutput.write(try encoder.encode(report))
        FileHandle.standardOutput.write(Data("\n".utf8))
    } catch { fail("Cannot encode report: \(error)") }
}
if CommandLine.arguments.count == 3 {
    let sourceGroups = Dictionary(grouping: sourceObservations, by: { normalized($0.text) })
    let outputGroups = Dictionary(grouping: outputObservations, by: { normalized($0.text) })
    var seen = Set<String>()
    var lines: [InventoryLine] = []
    for observation in sourceObservations {
        let key = normalized(observation.text)
        guard seen.insert(key).inserted else { continue }
        let sources = sourceGroups[key] ?? []
        let outputs = outputGroups[key] ?? []
        let source = sources.count == 1 ? sources[0] : nil
        let output = outputs.count == 1 ? outputs[0] : nil
        let status = sources.count != 1 || outputs.count > 1 ? "ambiguous" :
                     outputs.isEmpty ? "not-recognized-in-output" : "matched-text"
        lines.append(InventoryLine(text: observation.text, source: source, output: output,
                                   delta: source.flatMap { a in output.map { b in delta(a, b) } }, status: status))
    }
    for observation in outputObservations where sourceGroups[normalized(observation.text)] == nil {
        let key = normalized(observation.text)
        guard seen.insert(key).inserted else { continue }
        lines.append(InventoryLine(text: observation.text, source: nil, output: observation,
                                   delta: nil, status: "not-recognized-in-source"))
    }
    emit(InventoryReport(source: sourceRecord, output: outputRecord, lines: lines))
    exit(0) // Diagnostic inventory cannot certify fidelity.
}
let configURL = URL(fileURLWithPath: CommandLine.arguments[3]).standardizedFileURL
let config: Configuration
do { config = try JSONDecoder().decode(Configuration.self, from: Data(contentsOf: configURL)) }
catch { fail("Invalid labels JSON: \(error)") }
guard !config.labels.isEmpty,
      config.labels.allSatisfy({ !$0.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
                               !$0.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
                               $0.tolerancePx.isFinite && $0.tolerancePx >= 0 }) else {
    fail("Each label needs a name, expected text and nonnegative tolerancePx")
}
let comparisons = config.labels.map { label -> Comparison in
    let expected = normalized(label.text)
    let sourceMatches = sourceObservations.filter { normalized($0.text) == expected }
    let outputMatches = outputObservations.filter { normalized($0.text) == expected }
    let reason: String?
    if sourceMatches.count != 1 { reason = "Expected text recognized \(sourceMatches.count) times in source; requires exactly one match" }
    else if outputMatches.count != 1 { reason = "Expected text recognized \(outputMatches.count) times in output; requires exactly one match" }
    else { reason = nil }
    let source = sourceMatches.count == 1 ? sourceMatches[0] : nil
    let output = outputMatches.count == 1 ? outputMatches[0] : nil
    let measuredDelta: Box? = if let source, let output { delta(source, output) } else { nil }
    let withinTolerance = reason == nil && measuredDelta.map {
        [$0.x, $0.y, $0.width, $0.height].allSatisfy { abs(Double($0)) <= label.tolerancePx }
    } == true
    return Comparison(name: label.name, expectedText: label.text, tolerancePx: label.tolerancePx,
                      source: source, output: output, delta: measuredDelta,
                      invalidReason: reason, withinTolerance: withinTolerance)
}
let report = Report(source: sourceRecord, output: outputRecord, comparisons: comparisons)
emit(report)
if comparisons.contains(where: { !$0.withinTolerance }) { exit(1) }
