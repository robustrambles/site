module.exports = {
    currentYear: () => new Date().getFullYear(),
    stringify: (data) => data && JSON.stringify(data),
}