const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflict',
      message: `Unique constraint failed on the fields: ${err.meta?.target || 'unknown'}`
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not Found',
      message: err.meta?.cause || 'Record not found'
    });
  }

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
};

module.exports = errorHandler;
