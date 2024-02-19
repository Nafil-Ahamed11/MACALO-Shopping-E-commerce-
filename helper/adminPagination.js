const getPagination = async (data, page, pageSize) => {
    try {
      console.log('data',data);
      const skip = (page - 1) * pageSize;
      const currentPage = Math.max(1, parseInt(page, 10) || 1);
      const totalCount = data.length;
      const totalPages = Math.ceil(totalCount / pageSize);
  
      const slicedData = data.slice(skip, skip + pageSize);
  
      return {
        paginatedData: slicedData, // Change property name to paginatedData
        currentPage,
        totalPages,
        totalCount,
      };
    } catch (error) {
      console.log(error.message);
    }
  };
  
  module.exports = getPagination;
  