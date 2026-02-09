const API_URL = 'http://localhost:5000/api/books';

async function testSearch(term, type) {
    try {
        console.log(`Searching for ${type}: "${term}"...`);
        const res = await fetch(`${API_URL}?search=${term}`);
        const data = await res.json();

        if (data.length > 0) {
            console.log(`✅ Found ${data.length} books.`);
            data.forEach(b => console.log(`   - ${b.title} (Author: ${b.author}, Course: ${b.courseCode})`));
        } else {
            console.log(`❌ No books found for "${term}".`);
        }
        console.log('---');
    } catch (error) {
        console.error(`Error searching for "${term}":`, error.message);
    }
}


async function runTests() {
    // These values are taken from the books_dump.json we saw earlier
    // book1: title="book1", author="new author", course="cs112"
    // book2: title="book2", author="new author 2", course="cs113"

    await testSearch('book1', 'Title');
    await testSearch('new author', 'Author');
    await testSearch('cs112', 'Course Code');
    await testSearch('nonexistent', 'Non-existent term');
}

runTests();
