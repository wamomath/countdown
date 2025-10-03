let OFFSET = 0;

const getTimeOffset = async () => {
    let client_time = Date.now();

    let server_info_raw = await fetch("/sync?client_time="+client_time)
    let server_info = await server_info_raw.json()

    let nowTimeStamp = Date.now();

    // Parse server-client difference time and server timestamp from response
    let serverClientRequestDiffTime = server_info.diff;
    let serverTimestamp = server_info.server_time;

    let serverClientResponseDiffTime = nowTimeStamp - serverTimestamp;

    // Calculate server-client difference time on response and response time
    // Calculate the synced server time
    return (serverClientRequestDiffTime - nowTimeStamp + client_time - serverClientResponseDiffTime) / 2;
}

const getSyncedServerTime = () => {
    return Date.now() + OFFSET;
}