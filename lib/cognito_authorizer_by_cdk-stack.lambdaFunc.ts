exports.handler = async () => {
    const response = {
        statusCode: 200,
        body: JSON.stringify({ greeting: 'Hello from Lambda!' }),
    };
    return response;
};