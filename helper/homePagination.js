const getHomePagination = async (collection, page, pageSize) => {
    try {
        const skip = (page - 1) * pageSize;
        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const totalCount = await collection.countDocuments();
        
        // Fetch all products
        const allProducts = await collection.find().toArray();

        // Shuffle the products array to get a random order
        const shuffledProducts = shuffleArray(allProducts);

        // Extract the paginated portion of the shuffled products
        const categoryFilteredData = shuffledProducts.slice(skip, skip + pageSize);

        const startCount = (currentPage - 1) * pageSize + 1;
        const endCount = Math.min(currentPage * pageSize, totalCount);
        const totalPages = Math.ceil(totalCount / pageSize);

        return {
            paginationData: categoryFilteredData,
            currentPage,
            totalPages,
            totalCount,
            startCount,
            endCount
        };

    } catch (error) {
        console.log(error.message);
    }
};

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

module.exports = getHomePagination;
