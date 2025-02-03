function open_link(link){
    window.open(link, "_blank");
}

function bot_status(){
    open_link("https://pregnant-corenda-m7mdy9-c1ea62b9.koyeb.app/");
}

// Function to check the bot status from the server
async function checkBotStatus() {
    const statusElement = document.getElementById('botStatus');
    try {
        const response = await fetch('https://pregnant-corenda-m7mdy9-c1ea62b9.koyeb.app');
        const status = await response.text(); // Assuming the response is just plain text
        console.log(status)
        // Display the bot status in the div
        if (status === 'Bot is alive!') {
            statusElement.textContent = 'The bot is alive!';
            statusElement.style.color = 'green';
        } else {
            statusElement.textContent = 'The bot is down.';
            statusElement.style.color = 'red';
        }
    } catch (error) {
        console.error(error)
        statusElement.textContent = 'Error: Unable to check bot status, or the site is down.';
        statusElement.style.color = 'red';
    }
}

// Check bot status when the page loads
window.onload = checkBotStatus;