/**
 * Mock Payment Simulator
 *
 * Simulation rules (no real gateway involved):
 *   - Card number ending in 0000          → always fails  (declined)
 *   - Card number not exactly 16 digits   → always fails  (invalid card)
 *   - Everything else                     → success
 *
 * Returns: { success: bool, transactionId: string|null, reason: string }
 */
function generateTransactionId() {
    return "TXN-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = function simulatePayment(cardNumber) {
    var card = cardNumber ? cardNumber.toString().trim().replace(/\s+/g, "") : "";

    if (card.length !== 16 || !/^\d{16}$/.test(card))
        return { success: false, transactionId: null, reason: "Invalid card number. Must be 16 digits." };

    if (card.endsWith("0000"))
        return { success: false, transactionId: null, reason: "Card declined by issuing bank." };

    return { success: true, transactionId: generateTransactionId(), reason: "Payment approved." };
};
