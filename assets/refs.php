<?php
//header("Access-Control-Allow-Origin: *");

// set up request for access token
$data = array();
$account_id    = "2324982687001";
$client_id     = "3efad47d-b35d-4cb1-ab72-f8edaf11a4ab";
$client_secret = "WIdD8uNS2KLWl8mqpJ0deuq_2z3puAWkgwsWM9xiO6yQ2KYOy8e4Ec9-NXIgzSk441bCyVTHAB5buoVfSiZjyA";
$auth_string   = "{$client_id}:{$client_secret}";
$request       = "https://oauth.brightcove.com/v3/access_token?grant_type=client_credentials";
$ch            = curl_init($request);
curl_setopt_array($ch, array(
	CURLOPT_POST           => TRUE,
	CURLOPT_RETURNTRANSFER => TRUE,
	CURLOPT_SSL_VERIFYPEER => FALSE,
	CURLOPT_USERPWD        => $auth_string,
	CURLOPT_HTTPHEADER     => array(
		'Content-type: application/x-www-form-urlencoded',
	),
	CURLOPT_POSTFIELDS => $data
));
$response = curl_exec($ch);
curl_close($ch);
// Check for errors
if ($response === FALSE) {
	die(curl_error($ch));
}
// Decode the response
$responseData = json_decode($response, TRUE);
$access_token = $responseData["access_token"];

$method = "GET";
$request = "https://cms.api.brightcove.com/v1/accounts/{$account_id}/videos/?q=";

foreach ($_REQUEST["refs"] as $ref) {
	$request .= "reference_id:{$ref}%20";
}

//send the http request
$ch = curl_init($request);
curl_setopt_array($ch, array(
		CURLOPT_CUSTOMREQUEST  => $method,
		CURLOPT_RETURNTRANSFER => TRUE,
		CURLOPT_SSL_VERIFYPEER => FALSE,
		CURLOPT_HTTPHEADER     => array(
			'Content-type: application/json',
			"Authorization: Bearer {$access_token}",
		),
		CURLOPT_POSTFIELDS => json_encode($data)
	));
$response = curl_exec($ch);
curl_close($ch);
// Check for errors
if ($response === FALSE) {
	echo "Error: there was a problem with your API call"+
	die(curl_error($ch));
}
// Decode the response
// $responseData = json_decode($response, TRUE);
// return the response to the AJAX caller
echo $response;
?>