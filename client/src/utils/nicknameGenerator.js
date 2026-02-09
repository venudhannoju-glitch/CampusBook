/**
 * Generates a deterministic, anonymous nickname based on a unique ID.
 * The same ID will always generate the same nickname.
 * 
 * @param {string} id - The unique identifier (e.g., sellerId)
 * @returns {string} - A generated nickname (e.g., "Swift Fox")
 */
export const getNickname = (id) => {
    if (!id) return "Unknown Student";

    const adjectives = [
        "Hidden", "Secret", "Silent", "Mystery", "Swift", "Bright", "Clever",
        "Happy", "Calm", "Bold", "Wise", "Kind", "Cool", "Noble", "Super",
        "Eager", "Rare", "Lucky", "Pure", "Safe", "Neon", "Cyber", "Blue",
        "Red", "Green", "Gold", "Silver", "Iron", "Steel", "Cosmic"
    ];

    const nouns = [
        "Student", "Reader", "Scholar", "Learner", "Thinker", "Solver",
        "Eagle", "Tiger", "Lion", "Wolf", "Fox", "Bear", "Hawk", "Owl",
        "Falcon", "Panda", "Shark", "Whale", "Dolphin", "Raven", "Knight",
        "Ninja", "Wizard", "Scout", "Guide", "Star", "Moon", "Sun", "Comet"
    ];

    // Simple hash function to get a number from the string ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use absolute value to avoid negative indices
    hash = Math.abs(hash);

    // Pick adjective and noun based on the hash
    const adjIndex = hash % adjectives.length;
    const nounIndex = Math.floor(hash / 8) % nouns.length; // Use division instead of bit shift for safer large number handling

    return `${adjectives[adjIndex]} ${nouns[nounIndex]}`;
};
