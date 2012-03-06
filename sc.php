<?php

header('Content-type: application/json');
//require_once('Services/Soundcloud.php');

// Reverse the SoundCloud URL given to extract the track title
// and track ID.

if ($_GET["track_url"]) {
	$track_url = urldecode($_GET["track_url"]);
	$conn = curl_init();
	$url = "http://soundcloud.com/oembed?client_id=jzpVcFeuZMyd54jYSxFGvw&url=".$track_url."&format=json";
	curl_setopt($conn, CURLOPT_URL, $url);
	curl_setopt($conn, CURLOPT_RETURNTRANSFER, 1);
	$contents = curl_exec ($conn);
	
	echo $contents;
	
	curl_close ($conn);
}
?>
HEY BUDDY
