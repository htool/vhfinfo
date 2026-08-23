<?php
header("Content-Type: application/json; charset=utf-8");
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(array("error" => "POST only"));
    exit;
}

$payload = json_decode(file_get_contents("php://input"), true);
$country = strtoupper(preg_replace("/[^A-Za-z]/", "", isset($payload["country"]) ? $payload["country"] : ""));
if (strlen($country) < 2 || strlen($country) > 3) {
    http_response_code(400);
    echo json_encode(array("error" => "country required"));
    exit;
}

$tokenFile = __DIR__ . "/sync-git.token";
$token = is_readable($tokenFile) ? trim(file_get_contents($tokenFile)) : "";
if ($token === "") {
    http_response_code(503);
    echo json_encode(array("error" => "git sync is not configured"));
    exit;
}

$body = json_encode(
    array(
        "event_type" => "vhf-features-changed",
        "client_payload" => array("country" => $country),
    )
);
$context = stream_context_create(
    array(
        "http" => array(
            "method" => "POST",
            "header" =>
                "Content-Type: application/json\r\n" .
                "Accept: application/vnd.github+json\r\n" .
                "Authorization: Bearer " . $token . "\r\n" .
                "X-GitHub-Api-Version: 2022-11-28\r\n" .
                "User-Agent: vhfinfo-sync-git\r\n",
            "content" => $body,
            "ignore_errors" => true,
        ),
    )
);
$result = @file_get_contents(
    "https://api.github.com/repos/htool/VHFinfoSite/dispatches",
    false,
    $context
);
$statusLine = isset($http_response_header[0]) ? $http_response_header[0] : "";
$ok = (strpos($statusLine, "204") !== false || strpos($statusLine, "200") !== false);
if (!$ok) {
    http_response_code(502);
    echo json_encode(
        array(
            "error" => "GitHub dispatch failed",
            "status" => $statusLine,
            "body" => $result,
        )
    );
    exit;
}
echo json_encode(array("ok" => true, "country" => $country));
