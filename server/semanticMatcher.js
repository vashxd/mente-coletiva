const natural = require('natural');
const stringSimilarity = require('string-similarity');

class SemanticMatcher {
    constructor() {
        // PT-BR Tokenizer and Stemmer
        this.tokenizer = new natural.AggressiveTokenizerPt();
        this.stemmer = natural.PorterStemmerPt;

        // Custom Stopwords (expandable)
        this.stopwords = new Set([
            'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas',
            'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
            'e', 'ou', 'mas', 'que', 'se', 'por', 'pra', 'para', 'com', 'sem',
            'meu', 'minha', 'seu', 'sua', 'nosso', 'nossa',
            'muito', 'muita', 'pouco', 'pouca', 'bom', 'boa', 'ruim',
            'grande', 'pequeno', 'ser', 'estar', 'ter', 'fazer',
            'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas'
        ]);

        // Synonym Map (Canonical Form -> List of Synonyms)
        // We map TO the canonical form for easier comparison
        // e.g. 'limpeza' is canonical. 'faxina' maps to 'limpeza'.
        this.synonymMap = new Map();

        this.addSynonyms('limpeza', ['faxina', 'asseio', 'higienização']);
        this.addSynonyms('dinheiro', ['grana', 'bufunfa', 'tostão', 'verba']);
        this.addSynonyms('comida', ['rango', 'refeição', 'alimento']);
        this.addSynonyms('trabalho', ['emprego', 'trampo', 'serviço', 'labuta']);
        this.addSynonyms('carro', ['automóvel', 'veículo', 'possante']);
        this.addSynonyms('celular', ['smartphone', 'telemóvel', 'zap']);
        this.addSynonyms('feliz', ['alegre', 'contente', 'satisfeito']);
        this.addSynonyms('triste', ['chateado', 'infeliz', 'melancólico']);
    }

    addSynonyms(canonical, synonyms) {
        // Canonical itself should map to canonical (optional but safe)
        // logic: if I see 'faxina', I replace with 'limpeza'.
        synonyms.forEach(syn => {
            // Must normalize the KEY (synonym) because input text is normalized before lookup.
            const normalizedSyn = syn.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .trim();
            this.synonymMap.set(normalizedSyn, canonical.toLowerCase());
        });
    }

    normalize(text) {
        if (!text) return '';

        // 1. Lowercase and remove accents
        let normalized = text.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .trim();

        // 2. Tokenize
        const tokens = this.tokenizer.tokenize(normalized);

        // 3. Filter Stopwords & Apply Synonyms & Stemming
        const processedTokens = tokens
            .filter(token => !this.stopwords.has(token)) // Remove stopwords
            .map(token => {
                // Check synonym map first (exact match)
                if (this.synonymMap.has(token)) {
                    return this.synonymMap.get(token);
                }
                // If not in synonym map, maybe stems match?
                // Actually, let's keep it simple: Replace Synonyms -> Then Stem.
                return token;
            })
            // .map(token => this.stemmer.stem(token)) // Stemming can be aggressive.
            // Let's TRY WITH Stemming?
            // "estudar" -> "estud"
            // "estudo" -> "estud"
            // "limpeza" -> "limpez"
            // "faxina" -> "limpeza" (via synonym) -> "limpez"
            // Ideally we stem AFTER synonym replacement.
            .map(token => this.stemmer.stem(token));

        // 4. Sort and Join?
        // Sorting helps with "bolo de cenoura" vs "cenoura bolo" (if user typed weirdly)
        // But might break "guarda chuva" vs "chuva guarda".
        // For Mente Coletiva, order usually implies specific meaning, but "boa limpeza" -> "limpez" is 1 token so sort doesn't matter.
        processedTokens.sort();

        return processedTokens.join(' ');
    }

    isSimilar(text1, text2) {
        if (!text1 || !text2) return false;

        // Exact raw match
        if (text1.toLowerCase().trim() === text2.toLowerCase().trim()) return true;

        const norm1 = this.normalize(text1);
        const norm2 = this.normalize(text2);

        // Exact normalized match (covers synonyms, stemming, stopword removal)
        if (norm1 === norm2 && norm1.length > 0) return true;

        // If normalized forms are just barely different (e.g. slight typo that stemming missed?)
        // Use Levenshtein on the NORMALIZED string.
        if (norm1.length > 0 && norm2.length > 0) {
            const similarity = stringSimilarity.compareTwoStrings(norm1, norm2);
            return similarity > 0.85;
        }

        return false;
    }
}

module.exports = new SemanticMatcher();
