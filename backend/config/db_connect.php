<?php
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "web_skripsi_db";

try {
  $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
  $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
  die(json_encode(["success" => false, "message" => $e->getMessage()]));
}
