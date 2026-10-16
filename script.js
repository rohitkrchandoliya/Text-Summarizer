const summarizeButton = document.getElementById("summarizeBtn");
const input = document.getElementById("inputText");
const output = document.getElementById("summaryOutput");

const STOP_WORDS = new Set((
    "a an the and or but if then so because as of at by for from in into on onto to with without " +
    "is are was were be been being am do does did have has had it its this that these those " +
    "i you he she we they them their our your my me him her not no can could will would should " +
    "may might must about over under after before than also very more most some any each such"
).split(/\s+/));

function splitSentences(text) {
    const trimmed = text.trim();
    if (!trimmed) return [];

    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
        const segmenter = new Intl.Segmenter(undefined, { granularity: "sentence" });
        return [...segmenter.segment(trimmed)]
            .map(item => item.segment.trim())
            .filter(Boolean);
    }

    // Fallback for browsers without Intl.Segmenter.
    return trimmed.match(/[^.!?]+[.!?]?/gu)?.map(s => s.trim()).filter(Boolean) || [trimmed];
}

function summarize(text) {
    const sentences = splitSentences(text);
    if (sentences.length <= 2) return sentences.join(" ");

    const wordsBySentence = sentences.map(sentence =>
        (sentence.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
            .filter(word => !STOP_WORDS.has(word) && word.length > 2)
    );
    const frequency = new Map();

    for (const words of wordsBySentence) {
        for (const word of words) frequency.set(word, (frequency.get(word) || 0) + 1);
    }

    const scores = sentences.map((sentence, index) => {
        const words = wordsBySentence[index];
        const lexicalScore = words.length
            ? words.reduce((sum, word) => sum + (frequency.get(word) || 0), 0) / Math.sqrt(words.length)
            : 0;
        const positionBonus = index === 0 ? 1.15 : index === sentences.length - 1 ? 1.05 : 1;
        return { index, score: lexicalScore * positionBonus };
    });

    const summarySize = Math.min(3, Math.max(1, Math.ceil(sentences.length * 0.3)));
    const selected = scores
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .slice(0, summarySize)
        .map(item => item.index)
        .sort((a, b) => a - b);

    return selected.map(index => sentences[index]).join(" ");
}

summarizeButton.addEventListener("click", () => {
    const text = input.value;
    if (!text.trim()) {
        output.textContent = "Please enter some text to summarize.";
        return;
    }

    output.textContent = summarize(text);
});
