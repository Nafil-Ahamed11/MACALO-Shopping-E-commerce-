
const getPagination = async (collection, page, pageSize, categoryQuery = {}, generalQuery = {}) => {
    try {
       
        const skip = (page - 1) * pageSize;
        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        
       
        const totalCount = await collection.countDocuments(categoryQuery);
        const categoryFilteredData = await collection.find(categoryQuery).skip(skip).limit(pageSize).toArray();
        const startCount = (currentPage-1)*pageSize+1
        const endCount = Math.min(currentPage*pageSize,totalCount);

        
        

        
        // const paginationData = categoryFilteredData.(skip, skip + pageSize);

        const totalPages = Math.ceil(totalCount / pageSize);

        return {
            paginationData:categoryFilteredData,
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


module.exports = getPagination;

