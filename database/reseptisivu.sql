
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `recipe_id` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `stars` int(11) NOT NULL CHECK (`stars` between 1 and 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



INSERT INTO `reviews` (`id`, `recipe_id`, `user_id`, `stars`, `comment`, `created_at`) VALUES
(1, '52874', 4, 1, 'oiugfd', '2025-04-01 11:22:08'),
(2, '52874', 4, 4, 'Huono respeti!', '2025-04-02 06:19:54');



CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `created_at`, `password`) VALUES
(1, 'Figonadoptiolapsi', 'junnu.kalliokoski@gmail.com', '', '2025-04-01 09:08:27', '$2b$10$fUTmPS5BOhCE2jb8myez6ultAmgRMuEt06GFoIBtFEUE00HxpQ2WC'),
(2, 'figoLa', 'itcomeswitheggroll@gmail.com', '', '2025-04-01 09:09:52', '$2b$10$JHsIe2HA54w4ec/smmKq1unGxgvKJpYWVJP5h1hvnzvInsfg6qN2.'),
(3, 'Figonadoptiolapsi2', '123@gmail.com', '', '2025-04-01 09:50:47', '$2b$10$CAaEK7nn4KBQSQUvNzF4ZekRlHL0vZguIuUQEVpwjjNCnFxxDTYNy'),
(4, 'livar', '1234@gmail.com', '', '2025-04-01 10:00:05', '$2b$10$yY2.0N/gTw0IvlYE0ArS1O54S4pIZ0iFT9HbvgNhOG5yYCAZjNHKO');


ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);


ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);


ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;


ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;


