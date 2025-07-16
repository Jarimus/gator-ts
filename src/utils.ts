export function parseDuration(durationStr: string) {

    const defaultTime = () => {
        console.log("Invalid time format. Defaulting to 1m");
        return 60_000;
    }

    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);
    if (!match) {
        return defaultTime();
    }
    switch (match[2]) {
        case "ms":
            try {
                return Number(match[1]);
            } catch (err) {
                return defaultTime();
            }
        case "s":
            try {
                return Number(match[1])*1000;
            } catch (err) {
                return defaultTime();
            }
        case "m":
            try {
                return Number(match[1])*60*1000;
            } catch (err) {
                return defaultTime();
            }
        case "h":
            try {
                return Number(match[1])*60*60*1000;
            } catch (err) {
                return defaultTime();
            }
    
        default:
            return defaultTime();
    }
}

export function displayFetchInterval(timeInMilliseconds: number) {
    // Display fetch interval in a humanreadable format
    const seconds = Math.floor(timeInMilliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    console.log(`Fetching feeds every ${hours}h ${minutes % 60}m ${seconds % 60}s\n`);
}