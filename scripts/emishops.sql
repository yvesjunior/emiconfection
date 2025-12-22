-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: emi_db
-- Generation Time: Dec 20, 2025 at 06:28 PM
-- Server version: 10.4.12-MariaDB-1:10.4.12+maria~bionic
-- PHP Version: 7.4.5

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `emishops`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `remember_token` varchar(255) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `name`, `username`, `email`, `phone`, `password`, `role`, `photo`, `created_at`, `updated_at`, `remember_token`, `status`) VALUES
(1, 'Admin', 'admin', 'admin@gmail.com', '000 000 000', '$2y$10$DozM30vRGMY9aDIh2EKxROmvuJRtBMimO2ox/rF8uXjMBYBjLvVRe', 'Administrator', '1510211044icon.jpg', '2017-01-24 03:21:40', '2017-12-07 13:44:10', 'p6owIvBSIYbH888SYIGRriFLZGYVahahQ0KMt3snhOqIAK5Mob1fzdLdmyzk', 1),
(2, 'S Zaman', 'genius', 'genius@gmail.com', '000 000 000', '$2y$10$DozM30vRGMY9aDIh2EKxROmvuJRtBMimO2ox/rF8uXjMBYBjLvVRe', 'Administrator', '11822730_1619598781649385_5506560502405630990_n.jpg', '2017-01-27 22:35:17', '2017-03-06 11:02:08', '', 1);

-- --------------------------------------------------------

--
-- Table structure for table `advertisements`
--

CREATE TABLE `advertisements` (
  `id` int(11) NOT NULL,
  `type` enum('script','banner') NOT NULL,
  `advertiser_name` varchar(255) DEFAULT NULL,
  `redirect_url` varchar(255) DEFAULT NULL,
  `banner_size` varchar(255) NOT NULL,
  `banner_file` varchar(255) DEFAULT NULL,
  `script` text DEFAULT NULL,
  `clicks` int(11) NOT NULL DEFAULT 0,
  `status` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `blogs`
--

CREATE TABLE `blogs` (
  `id` int(11) NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `details` mediumtext COLLATE utf8_unicode_ci DEFAULT NULL,
  `featured_image` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `source` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `views` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `brand_banner`
--

CREATE TABLE `brand_banner` (
  `id` int(11) NOT NULL,
  `type` enum('brand','banner') NOT NULL DEFAULT 'brand',
  `image` varchar(255) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `status` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `brand_banner`
--

INSERT INTO `brand_banner` (`id`, `type`, `image`, `link`, `status`) VALUES
(3, 'brand', '1509812425logo-carousel-2.png', NULL, 1),
(5, 'banner', '1510213233b1.jpg', 'https://www.facebook.com/GeniusOcean/', 1),
(6, 'brand', '15101552813AD3575600000578-3875228-The_FedEx_logo_was_created_in_1994_and_is_instantly_recognisable-m-2_1480696442823.jpg', NULL, 1),
(7, 'banner', '1510213249b1.jpg', 'https://www.facebook.com/GeniusOcean/', 1),
(8, 'banner', '1510213270b1.jpg', 'https://www.facebook.com/GeniusOcean/', 1);

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `uniqueid` varchar(255) DEFAULT NULL,
  `product` int(11) DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `size` varchar(255) DEFAULT NULL,
  `cost` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`id`, `uniqueid`, `product`, `title`, `quantity`, `size`, `cost`) VALUES
(3, 'ReGPgkX', 26, 'Product Name Here', 1, NULL, 211);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `mainid` int(11) DEFAULT NULL,
  `subid` int(11) DEFAULT NULL,
  `role` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET latin1 NOT NULL,
  `feature_image` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `featured` int(11) NOT NULL DEFAULT 0,
  `status` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `mainid`, `subid`, `role`, `name`, `slug`, `feature_image`, `featured`, `status`) VALUES
(67, NULL, NULL, 'main', 'tissus', 'tissus', '1662690844Screen Shot 2022-08-20 at 4.23.37 PM.png', 1, 1),
(68, 67, NULL, 'sub', 'kentes', 'kentes', '16626909581.png', 1, 1),
(69, 67, NULL, 'sub', 'modernes', 'modernes', '1662769113il_340x270.2246091953_94q0.webp', 1, 1),
(70, 67, NULL, 'sub', 'fasodanfani', 'fasodanfani', '1662769362xFXS1lvD4mJk7cUzXA6sm.jpeg.pagespeed.ic.iu6kKaAde7.webp', 1, 1),
(71, NULL, NULL, 'main', 'coutures', 'coutures', '1662769666images.jpeg', 1, 1),
(72, 71, NULL, 'sub', 'femmes', 'femmes', '1662769692iris-van-herpen-couture-fall22-paris0001.webp', 1, 1),
(73, 71, NULL, 'sub', 'hommes', 'hommes', '1662769747download.jpeg', 1, 1),
(74, NULL, NULL, 'main', 'accessoires', 'accessoires', '1662769801mise-plat-accessoires-mode-femme-couleurs-jaunes_72402-2654-min.jpeg', 1, 1),
(75, 74, NULL, 'sub', 'meches', 'meches', '1662770014meche.jpeg', 1, 1),
(76, 74, NULL, 'sub', 'perruques', 'perruques', '1662770108body_wave_human_hair_lace_front_wig_for_women_online_for_sale_bettyou_series-1022.webp', 1, 1),
(77, 74, NULL, 'sub', 'eventails', 'eventails', '1662770229Eventail_chic_mariage_J_2-min_800x.jpeg', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `code_scripts`
--

CREATE TABLE `code_scripts` (
  `id` int(11) NOT NULL,
  `google_analytics` text NOT NULL,
  `meta_keys` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `code_scripts`
--

INSERT INTO `code_scripts` (`id`, `google_analytics`, `meta_keys`) VALUES
(1, '<script>\r\n   //Google Analytics Scriptfffffffffffffffffffffffssssfffffs\r\n</script>', 'smile world, bootiqo, chicnshop, deals, promotiel, chaussures, vetemens, coutures, homme, femme, fashion, pagne, baoule, traditionnelle');

-- --------------------------------------------------------

--
-- Table structure for table `counter`
--

CREATE TABLE `counter` (
  `id` int(11) NOT NULL,
  `type` enum('referral','browser') NOT NULL DEFAULT 'referral',
  `referral` varchar(255) DEFAULT NULL,
  `total_count` int(11) NOT NULL DEFAULT 0,
  `todays_count` int(11) NOT NULL DEFAULT 0,
  `today` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `counter`
--

INSERT INTO `counter` (`id`, `type`, `referral`, `total_count`, `todays_count`, `today`) VALUES
(1, 'browser', 'Windows 10', 83, 0, NULL),
(2, 'browser', 'Windows 8.1', 3, 0, NULL),
(3, 'browser', 'Unknown OS Platform', 21, 0, NULL),
(4, 'browser', 'iPhone', 19, 0, NULL),
(5, 'browser', 'Mac OS X', 123, 0, NULL),
(6, 'browser', 'Windows 7', 2, 0, NULL),
(7, 'browser', 'Windows XP', 57, 0, NULL),
(8, 'browser', 'Android', 2, 0, NULL),
(9, 'referral', 'www.bing.com', 8, 0, NULL),
(10, 'browser', 'Linux', 10, 0, NULL),
(11, 'browser', 'Ubuntu', 2, 0, NULL),
(12, 'browser', 'web', 237472, 0, NULL),
(13, 'referral', 'www.google.com', 94824, 0, NULL),
(14, 'referral', 'www.emishops.net', 13893, 0, NULL),
(15, 'referral', '34.71.128.116', 261, 0, NULL),
(16, 'referral', 'm.facebook.com', 150, 0, NULL),
(17, 'referral', 'l.facebook.com', 193, 0, NULL),
(18, 'referral', 'lm.facebook.com', 1, 0, NULL),
(19, 'referral', 'l.wl.co', 65, 0, NULL),
(20, 'referral', 'www.gumbo.com', 2, 0, NULL),
(21, 'referral', 'www.tiktok.com', 6, 0, NULL),
(22, 'referral', NULL, 3020, 0, NULL),
(23, 'referral', 'baidu.com', 8, 0, NULL),
(24, 'referral', 'www.google.fr', 17, 0, NULL),
(25, 'referral', 'com.google.android.googlequicksearchbox', 32, 0, NULL),
(26, 'referral', 'google.com', 20, 0, NULL),
(27, 'referral', 'www.google.it', 5, 0, NULL),
(28, 'referral', 'www.google.com.hk', 36, 0, NULL),
(29, 'referral', 'solasplaytherapy.com', 2, 0, NULL),
(30, 'referral', 'www.responsinator.com', 10, 0, NULL),
(31, 'referral', 'EMISHOPS.NET', 20, 0, NULL),
(32, 'referral', 'bit.ly', 3, 0, NULL),
(33, 'referral', 'jep.lol', 1, 0, NULL),
(34, 'referral', 'www.google.ci', 1, 0, NULL),
(35, 'referral', 'www.google.ca', 3, 0, NULL),
(36, 'referral', 'bakman.fresnounified.org', 1, 0, NULL),
(37, 'referral', 'qiper.ru', 1, 0, NULL),
(38, 'referral', 'developer.mozilla.org', 2, 0, NULL),
(39, 'referral', 'lens.google.com', 2, 0, NULL),
(40, 'referral', 'www.google.de', 2, 0, NULL),
(41, 'referral', '2ip.io', 2, 0, NULL),
(42, 'referral', 'xnxx.com', 3, 0, NULL),
(43, 'referral', 'yandex.ru', 5, 0, NULL),
(44, 'referral', 'youtube.com', 1, 0, NULL),
(45, 'referral', 'glassdoor.com', 1, 0, NULL),
(46, 'referral', 'waberski.racing', 1, 0, NULL),
(47, 'referral', 'mutiarahidup.resources.s3.amazonaws.com', 1, 0, NULL),
(48, 'referral', '50.145.26.101', 1, 0, NULL),
(49, 'referral', 'rcascaffolding.co.uk', 1, 0, NULL),
(50, 'referral', 'aehecuador.haei.org', 1, 0, NULL),
(51, 'referral', '120.112.8.32', 2, 0, NULL),
(52, 'referral', '152.101.54.16', 1, 0, NULL),
(53, 'referral', 'mail.saarfuchs.com', 1, 0, NULL),
(54, 'referral', '18.208.50.162', 1, 0, NULL),
(55, 'referral', 'autodiscover.sabtacular.com', 2, 0, NULL),
(56, 'referral', '211.54.27.242', 1, 0, NULL),
(57, 'referral', 'www.quora.com', 2, 0, NULL),
(58, 'referral', 'tbgdancoinc.com', 1, 0, NULL),
(59, 'referral', 'www.surveymonkey.com', 1, 0, NULL),
(60, 'referral', 'www.beritasia.id.203-175-8-164.cprapid.com', 1, 0, NULL),
(61, 'referral', '41.218.69.213', 1, 0, NULL),
(62, 'referral', '65.9.166.198', 1, 0, NULL),
(63, 'referral', 'cmm-prd-apimgt-scus-001.scm.azure-api.net', 1, 0, NULL),
(64, 'referral', 'www.bryn-mawr.web.id', 1, 0, NULL),
(65, 'referral', '150.91.180.182', 1, 0, NULL),
(66, 'referral', '150.91.173.119', 1, 0, NULL),
(67, 'referral', 'shekelimall.co.tz', 1, 0, NULL),
(68, 'referral', 'huakebio.com', 1, 0, NULL),
(69, 'referral', 'wxtvdszton.de-04.visual-paradigm.com', 1, 0, NULL),
(70, 'referral', 'karlnadin.karlnadin.com', 1, 0, NULL),
(71, 'referral', 'a.bb.ccc.dddd.veub.jiamuji.com.cn', 1, 0, NULL),
(72, 'referral', '45.60.100.164', 1, 0, NULL),
(73, 'referral', 'www.google.ru', 3, 0, NULL),
(74, 'referral', 'www.trannymovie.com', 1, 0, NULL),
(75, 'referral', 'www.google.es', 5, 0, NULL),
(76, 'referral', 'royalcaribbeanbeth.com', 1, 0, NULL),
(77, 'referral', 'www.google.com.au', 4, 0, NULL),
(78, 'referral', 'www.google.co.jp', 1, 0, NULL),
(79, 'referral', 'duckduckgo.com', 1, 0, NULL),
(80, 'referral', 'www.google.co.in', 3, 0, NULL),
(81, 'referral', '154.3.218.8', 1, 0, NULL),
(82, 'referral', 'www.google.com.br', 3, 0, NULL),
(83, 'referral', 'gemini.google.com', 1, 0, NULL),
(84, 'referral', 'mopritel.com', 1, 0, NULL),
(85, 'referral', '78.29.53.57', 4, 0, NULL),
(86, 'referral', 'www.google.com.sg', 3, 0, NULL),
(87, 'referral', 'www.facebook.com', 1, 0, NULL),
(88, 'referral', 'www.google.co.kr', 1, 0, NULL),
(89, 'referral', 'www.google.co.uk', 1, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `faqs`
--

CREATE TABLE `faqs` (
  `id` int(11) NOT NULL,
  `question` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `answer` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `faqs`
--

INSERT INTO `faqs` (`id`, `question`, `answer`, `status`) VALUES
(1, 'First FAQ Question?', '<span style=\"color: rgb(17, 17, 17); font-family: Roboto, Arial, sans-serif; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: normal; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;\">One of the most beloved song of the 90\'s is here for, brought to you in fine hogh definition by one of the biggest SRK-Kajol fan Abhishek Singh.Hope you all enjoy the full song.Please subscribe as well for more videos.As I am new, you probably wont find much videos from me now. But since the <br></span><span style=\"color: rgb(17, 17, 17); font-family: Roboto, Arial, sans-serif; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: normal; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;\">One of the most beloved song of the 90\'s is here for, brought to you in fine hogh definition by one of the biggest SRK-Kajol fan Abhishek Singh.Hope you all enjoy the full song.Please subscribe as well for more videos.As I am new, you probably wont find much videos from me now. But since the <br></span><span style=\"color: rgb(17, 17, 17); font-family: Roboto, Arial, sans-serif; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: normal; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;\">One of the most beloved song of the 90\'s is here for, brought to you in fine hogh definition by one of the biggest SRK-Kajol fan Abhishek Singh.Hope you all enjoy the full song.Please subscribe as well for more videos.As I am new, you probably wont find much videos from me now. But since the </span><span style=\"color: rgb(17, 17, 17); font-family: Roboto, Arial, sans-serif; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: normal; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;\">One of the most beloved song of the 90\'s is here for, brought to you in fine hogh definition by one of the biggest SRK-Kajol fan Abhishek Singh.Hope you all enjoy the full song.Please subscribe as well for more videos.As I am new, you probably wont find much videos from me now. But since the <br><br></span><span style=\"color: rgb(17, 17, 17); font-family: Roboto, Arial, sans-serif; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: normal; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;\">One of the most beloved song of the 90\'s is here for, brought to you in fine hogh definition by one of the biggest SRK-Kajol fan Abhishek Singh.Hope you all enjoy the full song.Please subscribe as well for more videos.As I am new, you probably wont find much videos from me now. But since the </span><br><span style=\"color: rgb(17, 17, 17); font-family: Roboto, Arial, sans-serif; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: normal; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;\"></span><span style=\"color: rgb(17, 17, 17); font-family: Roboto, Arial, sans-serif; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: normal; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;\"></span><span style=\"color: rgb(17, 17, 17); font-family: Roboto, Arial, sans-serif; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: normal; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;\"></span>', 1),
(2, 'First FAQ Question 2?', 'In publishing and graphic design, lorem ipsum is a filler text commonly \r\nused to demonstrate the graphic elements of a document or visual \r\npresentation.<br><br>In publishing and graphic design, lorem ipsum is a filler text commonly \r\nused to demonstrate the graphic elements of a document or visual \r\npresentation.<br><br>In publishing and graphic design, lorem ipsum is a filler text commonly \r\nused to demonstrate the graphic elements of a document or visual \r\npresentation.<br>', 1);

-- --------------------------------------------------------

--
-- Table structure for table `ordered_products`
--

CREATE TABLE `ordered_products` (
  `id` int(11) NOT NULL,
  `orderid` varchar(255) DEFAULT NULL,
  `owner` enum('vendor','admin') DEFAULT NULL,
  `vendorid` int(11) DEFAULT NULL,
  `productid` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `cost` float DEFAULT NULL,
  `size` varchar(255) DEFAULT NULL,
  `payment` varchar(255) NOT NULL DEFAULT 'completed',
  `paid` enum('yes','no') NOT NULL DEFAULT 'no',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `status` enum('pending','processing','completed') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `ordered_products`
--

INSERT INTO `ordered_products` (`id`, `orderid`, `owner`, `vendorid`, `productid`, `quantity`, `cost`, `size`, `payment`, `paid`, `created_at`, `updated_at`, `status`) VALUES
(1, '1', 'admin', NULL, 25, 1, 20.99, '', 'pending', 'no', '2017-11-21 09:32:46', '2017-11-21 09:32:46', 'pending');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `customerid` int(11) NOT NULL,
  `products` varchar(255) DEFAULT NULL,
  `quantities` varchar(255) DEFAULT NULL,
  `sizes` varchar(255) DEFAULT NULL,
  `method` varchar(255) DEFAULT NULL,
  `shipping` varchar(255) DEFAULT NULL,
  `pickup_location` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `pay_amount` float NOT NULL,
  `txnid` varchar(255) DEFAULT NULL,
  `charge_id` varchar(255) DEFAULT NULL,
  `order_number` varchar(255) NOT NULL,
  `payment_status` varchar(255) NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `customer_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `customer_phone` varchar(255) NOT NULL,
  `customer_address` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `customer_city` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `customer_zip` varchar(255) DEFAULT NULL,
  `shipping_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `shipping_email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `shipping_phone` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `shipping_address` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `shipping_city` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `shipping_zip` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `order_note` text CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `booking_date` datetime DEFAULT NULL,
  `status` enum('pending','processing','completed','declined') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customerid`, `products`, `quantities`, `sizes`, `method`, `shipping`, `pickup_location`, `pay_amount`, `txnid`, `charge_id`, `order_number`, `payment_status`, `customer_email`, `customer_name`, `customer_phone`, `customer_address`, `customer_city`, `customer_zip`, `shipping_name`, `shipping_email`, `shipping_phone`, `shipping_address`, `shipping_city`, `shipping_zip`, `order_note`, `booking_date`, `status`) VALUES
(1, 0, '25', '1', NULL, 'Paypal', 'shipto', NULL, 29.83, NULL, NULL, 'Z0Zo1511256766', 'Pending', 'shaoneel@gmail.com', 'Test Name', '0000000000', 'Test Address', 'Los Angels', '6600', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-11-21 09:32:46', 'pending');

-- --------------------------------------------------------

--
-- Table structure for table `page_settings`
--

CREATE TABLE `page_settings` (
  `id` int(11) NOT NULL,
  `contact` text CHARACTER SET latin1 NOT NULL,
  `contact_email` text CHARACTER SET latin1 NOT NULL,
  `about` text CHARACTER SET latin1 NOT NULL,
  `faq` text CHARACTER SET latin1 NOT NULL,
  `large_banner` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `banner_link` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `c_status` int(11) NOT NULL,
  `a_status` int(11) NOT NULL,
  `f_status` int(11) NOT NULL,
  `slider_status` int(11) NOT NULL DEFAULT 1,
  `category_status` int(11) NOT NULL DEFAULT 1,
  `sbanner_status` int(11) NOT NULL DEFAULT 1,
  `latestpro_status` int(11) NOT NULL DEFAULT 1,
  `featuredpro_status` int(11) NOT NULL DEFAULT 1,
  `lbanner_status` int(11) NOT NULL DEFAULT 1,
  `popularpro_status` int(11) NOT NULL DEFAULT 1,
  `blogs_status` int(11) NOT NULL DEFAULT 1,
  `brands_status` int(11) NOT NULL DEFAULT 1,
  `testimonial_status` int(11) NOT NULL DEFAULT 1,
  `subscribe_status` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `page_settings`
--

INSERT INTO `page_settings` (`id`, `contact`, `contact_email`, `about`, `faq`, `large_banner`, `banner_link`, `c_status`, `a_status`, `f_status`, `slider_status`, `category_status`, `sbanner_status`, `latestpro_status`, `featuredpro_status`, `lbanner_status`, `popularpro_status`, `blogs_status`, `brands_status`, `testimonial_status`, `subscribe_status`) VALUES
(1, 'Merci de nous avoir contactés, nous reviendrons vers vous sous peu.', 'admin@bootiqo.com', '<h2 style=\"margin-top: 0px; margin-right: 0px; margin-left: 0px; padding: 0px; line-height: 24px; font-family: DauphinPlain; font-size: 24px; color: rgb(0, 0, 0);\">What is Lorem Ipsum?</h2><h2 style=\"margin-top: 0px; margin-right: 0px; margin-left: 0px; padding: 0px; line-height: 24px; font-family: DauphinPlain; font-size: 24px;\"><p style=\"margin-bottom: 15px; padding: 0px; text-align: justify; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, Arial, sans-serif; font-size: 14px;\"><strong style=\"margin: 0px; padding: 0px;\">Lorem Ipsum</strong>&nbsp;is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p><p style=\"margin-bottom: 15px; padding: 0px; text-align: justify; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, Arial, sans-serif; font-size: 14px;\"><br></p></h2><h2 style=\"margin-top: 0px; margin-right: 0px; margin-left: 0px; padding: 0px; line-height: 24px; font-family: DauphinPlain; font-size: 24px; color: rgb(0, 0, 0);\">Where does it come from?</h2><h2 style=\"margin-top: 0px; margin-right: 0px; margin-left: 0px; padding: 0px; line-height: 24px; font-family: DauphinPlain; font-size: 24px;\"><p style=\"margin-bottom: 15px; padding: 0px; text-align: justify; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, Arial, sans-serif; font-size: 14px;\">Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of \"de Finibus Bonorum et Malorum\" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, \"Lorem ipsum dolor sit amet..\", comes from a line in section 1.10.32.</p><p style=\"margin-bottom: 15px; padding: 0px; text-align: justify; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, Arial, sans-serif; font-size: 14px;\">The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from \"de Finibus Bonorum et Malorum\" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.</p></h2>', '<h2>Contact US</h2>', '1510211280banner-e-commerce1.png', 'https://www.facebook.com/GeniusOcean/', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `pickup_locations`
--

CREATE TABLE `pickup_locations` (
  `id` int(11) NOT NULL,
  `address` text CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `status` int(11) DEFAULT 1
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `pickup_locations`
--

INSERT INTO `pickup_locations` (`id`, `address`, `status`) VALUES
(2, 'Test Pickup Addresss', 1),
(3, 'Another Address', 1),
(4, 'Another address 2', 1),
(5, 'Test Pickup Addresss 2', 1);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `vendorid` int(11) DEFAULT NULL,
  `owner` enum('admin','vendor') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'admin',
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `category` varchar(255) CHARACTER SET latin1 NOT NULL,
  `description` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `price` float NOT NULL,
  `stock` int(11) DEFAULT NULL,
  `feature_image` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  `tags` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `featured` int(1) NOT NULL DEFAULT 0,
  `views` int(11) DEFAULT 0,
  `approved` enum('no','yes') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'yes',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `status` int(1) NOT NULL DEFAULT 1,
  `images` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `discount_id` bigint(20) DEFAULT NULL,
  `subcategory` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `code` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `vendorid`, `owner`, `title`, `category`, `description`, `price`, `stock`, `feature_image`, `tags`, `featured`, `views`, `approved`, `created_at`, `updated_at`, `status`, `images`, `discount_id`, `subcategory`, `code`) VALUES
(52, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67,68,', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 45000, 2, '16627618336.png', 'vert', 1, 1731, 'yes', '2022-09-09 22:17:24', '2025-12-19 21:17:41', 1, 'Na16627754981.png,3k16627755032.png,pb16627755073.png,Rb16627755124.png,nq16627755145.png,Re16627755176.png,Ys16627755187.png,Io16627755238.png,Oa16627755259.png', NULL, '68', '#EMIPRODxtlh2'),
(54, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 5, '16628409181.jpeg', 'rouge,or', 1, 1411, 'yes', '2022-09-10 20:15:26', '2025-12-20 07:51:46', 1, 'dI16628409191.jpeg,i016628409202.jpeg,0k16628409213.jpeg,AY16628409214.jpeg,Wp16628409225.jpeg,cD16628409236.jpeg,xr16628409247.jpeg,fA16628409258.jpeg,gx16628409259.jpeg', NULL, '68', '#EMIPROD6682'),
(55, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16628410191.jpeg', 'rouge,rose,or', 1, 1438, 'yes', '2022-09-10 20:17:05', '2025-12-19 09:42:04', 1, '9I16628410201.jpeg,JG16628410202.jpeg,gN16628410213.jpeg,Ve16628410224.jpeg,uw16628410225.jpeg,NP16628410236.jpeg,Mo16628410237.jpeg,PF16628410248.jpeg', NULL, '68', '#EMIPROD1061'),
(56, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16628410871.jpeg', 'blanc,or', 1, 1815, 'yes', '2022-09-10 20:18:12', '2025-12-20 10:20:33', 1, 'e616628410881.jpeg,5i16628410892.jpeg,pQ16628410893.jpeg,hG16628410904.jpeg,hV16628410905.jpeg,KC16628410916.jpeg,q916628410927.jpeg', NULL, '68', '#EMIPROD2814'),
(57, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 1, '16628411681.jpeg', 'rouge,multicolor', 1, 1364, 'yes', '2022-09-10 20:19:34', '2025-12-20 12:59:26', 1, 'xO16628411691.jpeg,XN16628411702.jpeg,fv16628411713.jpeg,cW16628411714.jpeg,Vi16628411725.jpeg,Mf16628411726.jpeg,Fe16628411737.jpeg', NULL, '68', '#EMIPROD6564'),
(59, NULL, 'admin', 'Éventail - mariage', '74,77,', '<ul><li>Éventail pour dame de compagnie</li><li>Perles grises et or</li></ul>', 10000, 2, '16631238604.1.jpg', 'vert,or,blanc', 1, 1460, 'yes', '2022-09-14 02:51:01', '2025-12-20 06:59:45', 1, 'NL16631243814.1.jpg,eD16631243824.2.jpg,gq16631243824.3.jpg,jx16631243834.4.jpg', NULL, '77', '#EMIPROD3851'),
(60, NULL, 'admin', 'Barrette - pinces à cheveux', '74,76,', '<ul><li>Barettes, pinces et épingles pour meches et perruques&nbsp;</li><li>Perles grises et brillantes</li></ul>', 3000, 3, '16631253555.5.jpg', 'grise,perle', 1, 1336, 'yes', '2022-09-14 03:15:58', '2025-12-19 02:18:18', 1, 'kk16631253565.1.jpg,CV16631253565.3.jpg,WW16631253575.4.jpg,dh16631253575.5.jpg,pf16631253585.jpg', NULL, '76', '#EMIPROD4882'),
(61, NULL, 'admin', 'Bouquets - mariage', '74', '<ul><li>Bouquets de mariages</li><li>Perles blanches</li></ul>', 25000, 2, '16631259546.jpg', 'mariage,rose', 1, 1363, 'yes', '2022-09-14 03:25:56', '2025-12-20 18:13:09', 1, 'X416631259546.2.jpg,gO16631259556.3.jpg,4i16631259556.4.jpg,0a16631259566.jpg', NULL, '77', '#EMIPROD9882'),
(62, NULL, 'admin', 'Ensemble bouquet de fleurs de mariage', '74', '<ul><li>Bouquets de fleurs</li><li>Ensemble pour mariée et dames de compagnies</li><li>Perles grises et blanches</li></ul>', 100000, 1, '16631265187.2.jpg', 'blanc,gris', 1, 1423, 'yes', '2022-09-14 03:35:26', '2025-12-19 21:24:26', 1, 'YR16631265187.1.jpg,Jl16631265197.2.jpg,Sf16631265207.3.jpg,mT16631265207.jpg', NULL, '77', '#EMIPROD4401'),
(63, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640491251.jpeg', 'jaune, or, blanc, volet', 1, 1488, 'yes', '2022-09-24 19:52:11', '2025-12-19 20:55:20', 1, 'Uj16640491271.jpeg,sy16640491286.jpeg,uH16640491294.jpeg,m416640491295.jpeg,vj16640491302.jpeg,I916640491313.jpeg', NULL, '68', '#EMIPROD8984'),
(64, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640491351.jpeg', 'brun, gris', 1, 1133, 'yes', '2022-09-24 19:52:18', '2025-12-19 03:46:20', 1, 'sB16640491351.jpeg,Cz16640491364.jpeg,Cl16640491365.jpeg,oZ16640491372.jpeg,vA16640491383.jpeg', NULL, '68', '#EMIPROD5761'),
(65, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640491421.jpeg', 'blanc, jaune, or', 1, 1100, 'yes', '2022-09-24 19:52:27', '2025-12-18 00:10:07', 1, 'qR16640491431.jpeg,Ks16640491446.jpeg,vk16640491454.jpeg,fR16640491455.jpeg,xN16640491462.jpeg,ev16640491463.jpeg', NULL, '68', '#EMIPROD9938'),
(66, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640491501.jpeg', 'blanc, gris', 1, 1136, 'yes', '2022-09-24 19:52:33', '2025-12-19 09:42:41', 1, '7316640491511.jpeg,zU16640491514.jpeg,E416640491522.jpeg,yr16640491523.jpeg', NULL, '68', '#EMIPROD3002'),
(67, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640491571.jpeg', 'rouge, vin, blanc, or', 1, 1110, 'yes', '2022-09-24 19:52:41', '2025-12-18 14:48:34', 1, 'Ha16640491581.jpeg,NP16640491594.jpeg,ey16640491595.jpeg,mD16640491602.jpeg,DG16640491613.jpeg', NULL, '68', '#EMIPROD7585'),
(68, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640491661.jpeg', 'vert, or', 1, 1136, 'yes', '2022-09-24 19:52:53', '2025-12-20 16:20:16', 1, 'r0166404916710.jpeg,Vt16640491681.jpeg,Mr16640491686.jpeg,Kw16640491697.jpeg,6g16640491698.jpeg,MG16640491714.jpeg,qg16640491715.jpeg,aP16640491729.jpeg,QG16640491722.jpeg,mP16640491733.jpeg', NULL, '68', '#EMIPROD9063'),
(70, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640491851.jpeg', 'rouge, or, bleu', 1, 1160, 'yes', '2022-09-24 19:53:11', '2025-12-20 17:50:33', 1, '9616640491851.jpeg,b016640491866.jpeg,Ir16640491874.jpeg,AG16640491885.jpeg,Je16640491892.jpeg,EX16640491903.jpeg', NULL, '68', '#EMIPROD1731'),
(71, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640491951.jpeg', 'blank, or', 1, 1085, 'yes', '2022-09-24 19:53:20', '2025-12-17 04:31:40', 1, 'eU16640491961.jpeg,Ue16640491966.jpeg,KB16640491977.jpeg,mE16640491984.jpeg,5416640491985.jpeg,4N16640491992.jpeg,R516640491993.jpeg', NULL, '68', '#EMIPROD8739'),
(72, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640492031.jpeg', 'rouge, vin, or, jaune', 1, 1155, 'yes', '2022-09-24 19:53:27', '2025-12-18 22:26:58', 1, 'RR16640492041.jpeg,Sz16640492046.jpeg,wX16640492047.jpeg,c416640492054.jpeg,jR16640492055.jpeg,St16640492062.jpeg,xM16640492063.jpeg', NULL, '68', '#EMIPROD9878'),
(73, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640492111.jpeg', 'violet, jaune', 1, 1131, 'yes', '2022-09-24 19:53:34', '2025-12-17 04:35:47', 1, 't616640492111.jpeg,V416640492124.jpeg,BC16640492122.jpeg,2b16640492133.jpeg', NULL, '68', '#EMIPROD3230'),
(74, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, 'Bq16640492186.jpeg', 'bleu, or', 1, 1191, 'yes', '2022-09-24 19:53:42', '2025-12-20 08:35:10', 1, 'Bq16640492186.jpeg,JM16640492194.jpeg,BW16640492205.jpeg,HM16640492212.jpeg,Qq16640492213.jpeg', NULL, '68', '#EMIPROD8555'),
(75, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640492271.jpeg', 'beige, jaune, or', 1, 1154, 'yes', '2022-09-24 19:53:52', '2025-12-17 04:32:42', 1, 'so16640492281.jpeg,zf16640492286.jpeg,4t16640492297.jpeg,ax16640492294.jpeg,K116640492305.jpeg,ZG16640492312.jpeg,4p16640492313.jpeg', NULL, '68', '#EMIPROD7303'),
(77, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640492491.jpeg', 'blanc, gris', 1, 1135, 'yes', '2022-09-24 19:54:13', '2025-12-19 06:38:35', 1, 'H816640492491.jpeg,rg16640492506.jpeg,j216640492504.jpeg,R416640492515.jpeg,S416640492512.jpeg,aw16640492523.jpeg', NULL, '68', '#EMIPROD3079'),
(78, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640492571.jpeg', 'blanc, or', 1, 1086, 'yes', '2022-09-24 19:54:21', '2025-12-17 22:53:01', 1, 'ZV16640492571.jpeg,2q16640492586.jpeg,zk16640492597.jpeg,go16640492594.jpeg,6v16640492605.jpeg,qH16640492602.jpeg,4h16640492613.jpeg', NULL, '68', '#EMIPROD4096'),
(79, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640492661.jpeg', 'violet, jaune, or', 1, 1147, 'yes', '2022-09-24 19:54:30', '2025-12-20 09:35:34', 1, '9E16640492671.jpeg,FW16640492676.jpeg,W416640492684.jpeg,Ok16640492685.jpeg,4e16640492692.jpeg,wq16640492703.jpeg', NULL, '68', '#EMIPROD7782'),
(80, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640492741.jpeg', 'rouge, wine, vin, gris', 1, 1091, 'yes', '2022-09-24 19:54:37', '2025-12-20 13:21:34', 1, 'sN16640492741.jpeg,XD16640492754.jpeg,JL16640492762.jpeg,ws16640492763.jpeg', NULL, '68', '#EMIPROD1924'),
(81, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640492821.jpeg', 'rouge, vin, or', 1, 1104, 'yes', '2022-09-24 19:54:47', '2025-12-18 06:10:39', 1, 'Zd16640492821.jpeg,ot16640492836.jpeg,oH16640492837.jpeg,Rf16640492848.jpeg,j516640492854.jpeg,c816640492855.jpeg,MR16640492862.jpeg,TO16640492863.jpeg', NULL, '68', '#EMIPROD5058'),
(82, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640492921.jpeg', 'blanc, mariage', 1, 1100, 'yes', '2022-09-24 19:54:58', '2025-12-19 01:29:46', 1, 'u6166404929210.jpeg,rY16640492931.jpeg,mt166404929311.jpeg,3g16640492946.jpeg,hm16640492947.jpeg,sQ16640492958.jpeg,QB16640492954.jpeg,NW16640492965.jpeg,Hd16640492969.jpeg,0316640492972.jpeg,VF16640492973.jpeg', NULL, '68', '#EMIPROD1609'),
(83, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640493031.jpeg', 'bleu, blanc, gris', 1, 1134, 'yes', '2022-09-24 19:55:07', '2025-12-20 04:18:34', 1, 'RD16640493041.jpeg,x316640493046.jpeg,ei16640493054.jpeg,1V16640493055.jpeg,eT16640493062.jpeg,zF16640493063.jpeg', NULL, '68', '#EMIPROD9493'),
(84, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640493121.jpeg', 'jaune, or, rouge', 1, 1089, 'yes', '2022-09-24 19:55:17', '2025-12-19 19:53:10', 1, 'M216640493131.jpeg,9E16640493136.jpeg,dP16640493147.jpeg,mF16640493144.jpeg,cX16640493155.jpeg,kC16640493162.jpeg,kV16640493163.jpeg', NULL, '68', '#EMIPROD6188'),
(85, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640493221.jpeg', 'vert, or', 1, 1107, 'yes', '2022-09-24 19:55:27', '2025-12-17 04:36:34', 1, 'XP16640493221.jpeg,1z16640493236.jpeg,IG16640493237.jpeg,S716640493248.jpeg,Fy16640493254.jpeg,zs16640493255.jpeg,YF16640493269.jpeg,1q16640493262.jpeg,vc16640493273.jpeg', NULL, '68', '#EMIPROD7338'),
(86, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640493321.jpeg', 'blanc, violet', 1, 1123, 'yes', '2022-09-24 19:55:36', '2025-12-20 03:05:25', 1, 'p716640493321.jpeg,KE16640493336.jpeg,9K16640493337.jpeg,kk16640493344.jpeg,Pq16640493345.jpeg,PD16640493352.jpeg,RV16640493353.jpeg', NULL, '68', '#EMIPROD6629'),
(87, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640493401.jpeg', 'vert, or', 1, 1147, 'yes', '2022-09-24 19:55:42', '2025-12-18 19:08:52', 1, 'zN16640493401.jpeg,sJ16640493414.jpeg,OF16640493412.jpeg,6m16640493423.jpeg', NULL, '68', '#EMIPROD2221'),
(88, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640493471.jpeg', 'vert, jaune, or', 1, 1037, 'yes', '2022-09-24 19:55:51', '2025-12-20 05:48:00', 1, 'Vw16640493481.jpeg,PL16640493486.jpeg,7116640493494.jpeg,B116640493495.jpeg,Km16640493502.jpeg,Vh16640493513.jpeg', NULL, '68', '#EMIPROD8075'),
(89, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640493571.jpeg', 'jaune, or, blanc, vin', 1, 1131, 'yes', '2022-09-24 19:56:01', '2025-12-17 04:31:25', 1, 'kU16640493571.jpeg,5V16640493586.jpeg,OX16640493587.jpeg,Mu16640493594.jpeg,LH16640493595.jpeg,oh16640493602.jpeg,1m16640493613.jpeg', NULL, '68', '#EMIPROD1890'),
(90, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640493661.jpeg', 'vert, or', 1, 1159, 'yes', '2022-09-24 19:56:11', '2025-12-18 03:25:39', 1, 'nE16640493661.jpeg,Jq16640493676.jpeg,5r16640493687.jpeg,CD16640493684.jpeg,Dc16640493695.jpeg,tI16640493702.jpeg,zq16640493703.jpeg', NULL, '68', '#EMIPROD9465'),
(91, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640493751.jpeg', 'blanc, or', 1, 1118, 'yes', '2022-09-24 19:56:20', '2025-12-17 18:35:46', 1, 'cC16640493761.jpeg,zH16640493766.jpeg,yX16640493777.jpeg,t916640493774.jpeg,Mg16640493785.jpeg,cH16640493792.jpeg,aw16640493793.jpeg', NULL, '68', '#EMIPROD3829'),
(92, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640493841.jpeg', 'rouge, vin, wine, grise', 1, 1108, 'yes', '2022-09-24 19:56:28', '2025-12-20 18:16:36', 1, 'l916640493851.jpeg,3e16640493854.jpeg,jx16640493865.jpeg,rD16640493872.jpeg,ZY16640493873.jpeg', NULL, '68', '#EMIPROD9091'),
(93, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640493931.jpeg', 'vert, or', 1, 1127, 'yes', '2022-09-24 19:56:39', '2025-12-18 09:21:05', 1, '9z166404939310.jpeg,3P16640493941.jpeg,Bq166404939411.jpeg,iA16640493956.jpeg,IM16640493957.jpeg,Mj16640493968.jpeg,vP16640493964.jpeg,Xr16640493975.jpeg,f716640493979.jpeg,FF16640493982.jpeg,t616640493983.jpeg', NULL, '68', '#EMIPROD4233'),
(94, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640494041.jpeg', 'violet, or, jaune', 1, 1142, 'yes', '2022-09-24 19:56:48', '2025-12-20 16:18:49', 1, 'XD16640494051.jpeg,ab16640494056.jpeg,lt16640494064.jpeg,hn16640494065.jpeg,9516640494072.jpeg,3X16640494073.jpeg', NULL, '68', '#EMIPROD1400'),
(95, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640494131.jpeg', 'rose, jaune, or', 1, 1196, 'yes', '2022-09-24 19:56:58', '2025-12-20 09:55:32', 1, 'Of16640494141.jpeg,xF16640494146.jpeg,bJ16640494157.jpeg,dj16640494164.jpeg,Vt16640494175.jpeg,d216640494172.jpeg,Nk16640494183.jpeg', NULL, '68', '#EMIPROD3274'),
(96, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640494241.jpeg', 'rose, or, blanc', 1, 1167, 'yes', '2022-09-24 19:57:11', '2025-12-19 05:21:42', 1, '8T16640494241.jpeg,dg16640494256.jpeg,KV16640494267.jpeg,pY16640494268.jpeg,xY16640494274.jpeg,9L16640494275.jpeg,uR16640494289.jpeg,xY16640494292.jpeg,GK16640494303.jpeg', NULL, '68', '#EMIPROD5470'),
(97, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640494351.jpeg', 'violet, jaune, or, blanc', 1, 1254, 'yes', '2022-09-24 19:57:19', '2025-12-20 07:07:45', 1, 'Y916640494361.jpeg,Cv16640494364.jpeg,oN16640494375.jpeg,zL16640494382.jpeg,Wi16640494383.jpeg', NULL, '68', '#EMIPROD5956'),
(98, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640494431.jpeg', 'bleu, blanc', 1, 1157, 'yes', '2022-09-24 19:57:27', '2025-12-20 17:11:40', 1, 'Lg16640494441.jpeg,Bs16640494446.jpeg,B916640494454.jpeg,6g16640494465.jpeg,nT16640494462.jpeg,tt16640494473.jpeg', NULL, '68', '#EMIPROD5749'),
(99, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640494511.jpeg', 'rose, bleu, or', 1, 1181, 'yes', '2022-09-24 19:57:33', '2025-12-17 01:55:15', 1, 'OC16640494511.jpeg,GP16640494524.jpeg,SY16640494522.jpeg,o616640494533.jpeg', NULL, '68', '#EMIPROD6624'),
(100, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640494571.jpeg', 'bleu, or', 1, 1168, 'yes', '2022-09-24 19:57:40', '2025-12-19 20:18:52', 1, 'rY16640494581.jpeg,5E16640494584.jpeg,dY16640494592.jpeg,hq16640494593.jpeg', NULL, '68', '#EMIPROD2452'),
(101, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640494641.jpeg', 'jaune, or, blanc', 1, 1168, 'yes', '2022-09-24 19:57:48', '2025-12-20 17:48:42', 1, 'id16640494651.jpeg,Rp16640494656.jpeg,pS16640494664.jpeg,KY16640494675.jpeg,OD16640494672.jpeg,jb16640494683.jpeg', NULL, '68', '#EMIPROD7637'),
(102, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640494731.jpeg', 'rouge, vin, jaune, vert', 1, 1180, 'yes', '2022-09-24 19:57:58', '2025-12-20 07:55:11', 1, 'Tf16640494741.jpeg,Iq16640494756.jpeg,1u16640494757.jpeg,t316640494764.jpeg,ok16640494765.jpeg,WI16640494772.jpeg,Hw16640494773.jpeg', NULL, '68', '#EMIPROD3664'),
(103, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640494831.jpeg', 'bleu, blanc', 1, 1082, 'yes', '2022-09-24 19:58:06', '2025-12-17 04:27:03', 1, 'Cr16640494831.jpeg,sg16640494846.jpeg,KS16640494844.jpeg,ZE16640494855.jpeg,xT16640494852.jpeg,P816640494863.jpeg', NULL, '68', '#EMIPROD9389'),
(104, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640494911.jpeg', 'vert, or', 1, 1112, 'yes', '2022-09-24 19:58:15', '2025-12-20 01:56:01', 1, 'uU16640494911.jpeg,q816640494926.jpeg,ba16640494934.jpeg,Z716640494935.jpeg,eh16640494942.jpeg,Qm16640494953.jpeg', NULL, '68', '#EMIPROD4833'),
(105, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640495001.jpeg', 'blanc, gris', 1, 1218, 'yes', '2022-09-24 19:58:24', '2025-12-17 04:26:00', 1, 'YK16640495001.jpeg,hW16640495016.jpeg,KC16640495024.jpeg,6P16640495025.jpeg,Xf16640495032.jpeg,QD16640495033.jpeg', NULL, '68', '#EMIPROD6340'),
(106, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640495071.jpeg', 'vert, jaune, or', 1, 1156, 'yes', '2022-09-24 19:58:30', '2025-12-20 11:47:11', 1, '8v16640495081.jpeg,HA16640495094.jpeg,v116640495092.jpeg,AZ16640495103.jpeg', NULL, '68', '#EMIPROD4852'),
(107, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640495151.jpeg', 'rose, or', 1, 1277, 'yes', '2022-09-24 19:58:39', '2025-12-19 17:17:49', 1, 'Sw16640495151.jpeg,qs16640495166.jpeg,ij16640495167.jpeg,IY16640495174.jpeg,N116640495175.jpeg,fU16640495182.jpeg,j716640495183.jpeg', NULL, '68', '#EMIPROD7147'),
(108, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640495241.jpeg', 'beige, saumon, noir', 1, 1140, 'yes', '2022-09-24 19:58:48', '2025-12-20 14:12:39', 1, 'bq16640495241.jpeg,bf16640495256.jpeg,H816640495264.jpeg,1g16640495265.jpeg,e516640495272.jpeg,yQ16640495273.jpeg', NULL, '68', '#EMIPROD1913'),
(110, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640495411.jpeg', 'rouge, vin, gris', 1, 1152, 'yes', '2022-09-24 19:59:04', '2025-12-17 21:59:36', 1, 'rr16640495411.jpeg,Tc16640495424.jpeg,Wk16640495422.jpeg,6k16640495433.jpeg', NULL, '68', '#EMIPROD8479'),
(111, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640495491.jpeg', 'rouge, jaune, or', 1, 1160, 'yes', '2022-09-24 19:59:13', '2025-12-18 04:33:59', 1, 'AS16640495491.jpeg,As16640495506.jpeg,Un16640495507.jpeg,9N16640495518.jpeg,gw16640495514.jpeg,1z16640495525.jpeg,mW16640495522.jpeg,Di16640495533.jpeg', NULL, '68', '#EMIPROD9841'),
(112, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640495571.jpeg', 'rouge, vin, or, blanc', 1, 1137, 'yes', '2022-09-24 19:59:21', '2025-12-19 05:17:41', 1, 'PW16640495581.jpeg,Sc16640495596.jpeg,2i16640495594.jpeg,Ku16640495605.jpeg,co16640495602.jpeg,Le16640495613.jpeg', NULL, '68', '#EMIPROD9478'),
(113, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640495661.jpeg', 'bleu, bleu-noir, blue-black, jaune', 1, 1278, 'yes', '2022-09-24 19:59:30', '2025-12-20 15:27:39', 1, 'et16640495671.jpeg,uw16640495676.jpeg,4016640495684.jpeg,ox16640495695.jpeg,2f16640495692.jpeg,C416640495703.jpeg', NULL, '68', '#EMIPROD3410'),
(114, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640495751.jpeg', 'vert, or', 1, 1099, 'yes', '2022-09-24 19:59:39', '2025-12-17 01:58:23', 1, 'eX16640495751.jpeg,9z16640495766.jpeg,zn16640495774.jpeg,Kc16640495775.jpeg,6e16640495782.jpeg,NF16640495783.jpeg', NULL, '68', '#EMIPROD7798'),
(115, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640495821.jpeg', 'gris, or', 1, 1152, 'yes', '2022-09-24 19:59:44', '2025-12-20 09:55:07', 1, 'zC16640495821.jpeg,zs16640495834.jpeg,2k16640495832.jpeg,Qn16640495843.jpeg', NULL, '68', '#EMIPROD5794'),
(116, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640495881.jpeg', 'rouge, vin, or', 1, 1131, 'yes', '2022-09-24 19:59:52', '2025-12-19 12:20:00', 1, 'Kd16640495891.jpeg,vK16640495904.jpeg,2F16640495902.jpeg,0U16640495913.jpeg', NULL, '68', '#EMIPROD3209'),
(117, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640495951.jpeg', 'kaki, marron, or', 1, 1161, 'yes', '2022-09-24 19:59:58', '2025-12-19 23:50:27', 1, 'Gm16640495961.jpeg,GK16640495964.jpeg,Lw16640495972.jpeg,S616640495983.jpeg', NULL, '68', '#EMIPROD8629'),
(118, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640496031.jpeg', 'rouge, vin, blanc', 1, 1183, 'yes', '2022-09-24 20:00:07', '2025-12-19 11:19:21', 1, 'NV16640496031.jpeg,1i16640496046.jpeg,Ik16640496057.jpeg,El16640496054.jpeg,Iz16640496065.jpeg,6M16640496062.jpeg,v516640496073.jpeg', NULL, '68', '#EMIPROD1830'),
(119, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640496121.jpeg', 'bleu, jaune, or', 1, 1166, 'yes', '2022-09-24 20:00:16', '2025-12-19 15:57:15', 1, 'Pa16640496131.jpeg,Hx16640496144.jpeg,dg16640496145.jpeg,sh16640496152.jpeg,fy16640496163.jpeg', NULL, '68', '#EMIPROD7674'),
(120, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640496201.jpeg', 'vert, gris', 1, 1192, 'yes', '2022-09-24 20:00:24', '2025-12-20 09:10:34', 1, 'xF16640496211.jpeg,jx16640496214.jpeg,rL16640496225.jpeg,d816640496232.jpeg,YD16640496233.jpeg', NULL, '68', '#EMIPROD3545'),
(121, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640496291.jpeg', 'rouge, or, blanc', 1, 1243, 'yes', '2022-09-24 20:00:35', '2025-12-20 13:09:17', 1, 'Gw166404962910.jpeg,sg16640496301.jpeg,qE16640496306.jpeg,dV16640496317.jpeg,iY16640496328.jpeg,gT16640496324.jpeg,2i16640496335.jpeg,Kn16640496339.jpeg,CF16640496342.jpeg,Oj16640496353.jpeg', NULL, '68', '#EMIPROD7437'),
(122, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640496401.jpeg', 'rouge, or', 1, 1293, 'yes', '2022-09-24 20:00:45', '2025-12-20 13:31:25', 1, 'Ra16640496401.jpeg,6q16640496416.jpeg,i816640496427.jpeg,mQ16640496428.jpeg,Xq16640496434.jpeg,9y16640496435.jpeg,xU16640496442.jpeg,Dg16640496443.jpeg', NULL, '68', '#EMIPROD7097'),
(123, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640496501.jpeg', 'bleu, blanc', 1, 1074, 'yes', '2022-09-24 20:00:55', '2025-12-17 16:39:38', 1, '2T16640496501.jpeg,Tk16640496516.jpeg,ks16640496524.jpeg,3X16640496535.jpeg,Na16640496532.jpeg,TI16640496543.jpeg', NULL, '68', '#EMIPROD9265'),
(124, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640496581.jpeg', 'vert, or', 1, 1155, 'yes', '2022-09-24 20:01:01', '2025-12-17 04:38:53', 1, 'Qh16640496591.jpeg,us16640496594.jpeg,SR16640496602.jpeg,CJ16640496603.jpeg', NULL, '68', '#EMIPROD3508'),
(125, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640496661.jpeg', 'vert, or', 1, 1159, 'yes', '2022-09-24 20:01:10', '2025-12-20 12:42:23', 1, 'Wg16640496661.jpeg,Ol16640496676.jpeg,ik16640496684.jpeg,Gx16640496685.jpeg,Ld16640496692.jpeg,pa16640496703.jpeg', NULL, '68', '#EMIPROD9094'),
(126, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640496741.jpeg', 'rouge, vin, or', 1, 1172, 'yes', '2022-09-24 20:01:16', '2025-12-17 04:37:35', 1, '3K16640496741.jpeg,gG16640496754.jpeg,Qq16640496752.jpeg,Tn16640496763.jpeg', NULL, '68', '#EMIPROD6218'),
(127, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640496801.jpeg', 'bleu, maron', 1, 1140, 'yes', '2022-09-24 20:01:24', '2025-12-17 04:37:51', 1, 'jq16640496801.jpeg,hH16640496816.jpeg,1N16640496824.jpeg,XG16640496825.jpeg,eY16640496832.jpeg,6Q16640496833.jpeg', NULL, '68', '#EMIPROD8802'),
(128, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640496921.jpeg', 'rouge, or, blanc', 1, 1207, 'yes', '2022-09-24 20:01:37', '2025-12-20 08:40:32', 1, 'dI16640496931.jpeg,6T16640496936.jpeg,ff16640496947.jpeg,tf16640496944.jpeg,7716640496955.jpeg,8z16640496952.jpeg,Ek16640496963.jpeg', NULL, '68', '#EMIPROD4373'),
(129, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640497011.jpeg', 'bleu, blanc, or', 1, 1255, 'yes', '2022-09-24 20:01:46', '2025-12-20 04:17:10', 1, 'qr16640497021.jpeg,3O16640497036.jpeg,yd16640497034.jpeg,vB16640497045.jpeg,xU16640497052.jpeg,pJ16640497053.jpeg', NULL, '68', '#EMIPROD3041'),
(130, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640497101.jpeg', 'rouge, vin, marron', 1, 1253, 'yes', '2022-09-24 20:01:53', '2025-12-20 08:57:47', 1, 'EA16640497101.jpeg,6a16640497114.jpeg,4p16640497115.jpeg,tr16640497122.jpeg,hM16640497133.jpeg', NULL, '68', '#EMIPROD8857'),
(131, NULL, 'admin', 'Meche locks', '74', '<ul><li>Différentes couleurs et tailles disponibles</li></ul>', 20000, 1, '16641360561.png', 'noir,meche,locks', 1, 1439, 'yes', '2022-09-25 20:01:13', '2025-12-17 01:48:19', 1, '2U16641360581.png,oU16641360602.png,fF16641360633.png,Ke16641360694.png', NULL, '75', '#EMIPROD2422'),
(132, NULL, 'admin', 'Couture femme', '71,72,', '<ul><li>Robe de sortie</li></ul>', 25000, 1, '16641365931.png', 'robe,couture', 1, 1159, 'yes', '2022-09-25 20:10:06', '2025-12-20 03:56:22', 1, 'Pm16641365971.png,qG16641366002.png,Xr16641366023.png,L016641366044.png', NULL, '72', '#EMIPROD5426'),
(133, NULL, 'admin', 'Couture femme - ceremonie traditionnel', '71', '<ul><li>modele mariage traditionel</li><li>cérémonie&nbsp;</li></ul>', 50000, 1, '16641437441.png', 'mariage,traditionnel', 1, 1076, 'yes', '2022-09-25 22:09:14', '2025-12-19 16:28:42', 1, 'cG16641437461.png,dr16641437482.png,tz16641437503.png,Jn16641437524.png', NULL, '72', '#EMIPROD3285'),
(134, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652186261.jpeg', 'rouge, vin, or', 1, 1212, 'yes', '2022-10-08 08:43:51', '2025-12-20 11:10:33', 1, 'Bt16652186271.jpeg,TX16652186276.jpeg,iP16652186284.jpeg,Tp16652186295.jpeg,xV16652186292.jpeg,ha16652186303.jpeg', NULL, '68', '#EMIPROD5378'),
(135, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652186381.jpeg', 'gris', 1, 1189, 'yes', '2022-10-08 08:44:04', '2025-12-19 10:52:42', 1, 'Yl16652186391.jpeg,md16652186396.jpeg,uE16652186404.jpeg,yf16652186405.jpeg,tM16652186422.jpeg,fZ16652186433.jpeg', NULL, '68', '#EMIPROD3910'),
(136, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652186501.jpeg', 'bleu', 1, 1119, 'yes', '2022-10-08 08:44:15', '2025-12-17 08:23:48', 1, 'N016652186501.jpeg,Ef16652186516.jpeg,M616652186517.jpeg,wD16652186528.jpeg,kC16652186534.jpeg,de16652186535.jpeg,E216652186549.jpeg,kv16652186542.jpeg,vn16652186553.jpeg', NULL, '68', '#EMIPROD8491'),
(138, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652186731.jpeg', 'bleu, or', 1, 1222, 'yes', '2022-10-08 08:44:38', '2025-12-20 17:25:33', 1, 'Q716652186741.jpeg,dm16652186756.jpeg,BT16652186757.jpeg,Lg16652186764.jpeg,iC16652186765.jpeg,PO16652186772.jpeg,q716652186783.jpeg', NULL, '68', '#EMIPROD1523'),
(139, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652186861.jpeg', 'gris, rouge vin', 1, 1218, 'yes', '2022-10-08 08:44:52', '2025-12-17 21:54:53', 1, 'LS16652186871.jpeg,7516652186886.jpeg,yv16652186887.jpeg,bN16652186894.jpeg,yx16652186895.jpeg,Cr16652186902.jpeg,K516652186913.jpeg', NULL, '68', '#EMIPROD7027'),
(140, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652186981.jpeg', 'rose, blue-black', 1, 1220, 'yes', '2022-10-08 08:45:03', '2025-12-20 06:10:36', 1, 'nO16652186991.jpeg,wM16652186996.jpeg,sj16652187004.jpeg,UH16652187005.jpeg,2b16652187012.jpeg,Xw16652187023.jpeg', NULL, '68', '#EMIPROD1158'),
(141, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652187111.jpeg', 'vert, or', 1, 1153, 'yes', '2022-10-08 08:45:15', '2025-12-17 04:22:09', 1, 'RX16652187111.jpeg,4l16652187126.jpeg,Vs16652187124.jpeg,e416652187135.jpeg,U816652187132.jpeg,o116652187143.jpeg', NULL, '68', '#EMIPROD9157'),
(142, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652187231.jpeg', 'bleu, jaune', 1, 1178, 'yes', '2022-10-08 08:45:28', '2025-12-20 14:55:33', 1, 'mJ16652187241.jpeg,WY16652187256.jpeg,1n16652187254.jpeg,Ad16652187265.jpeg,aX16652187272.jpeg,OL16652187273.jpeg', NULL, '68', '#EMIPROD8664'),
(143, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652187341.jpeg', 'rose', 1, 1262, 'yes', '2022-10-08 08:45:40', '2025-12-20 12:23:08', 1, '3G16652187351.jpeg,mK16652187366.jpeg,jM16652187377.jpeg,4v16652187384.jpeg,lx16652187385.jpeg,EM16652187392.jpeg,m016652187393.jpeg', NULL, '68', '#EMIPROD9533'),
(144, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652187481.jpeg', 'rouge, vert', 1, 1188, 'yes', '2022-10-08 08:45:54', '2025-12-19 03:53:11', 1, 'VW16652187481.jpeg,4C16652187496.jpeg,sJ16652187507.jpeg,qG16652187514.jpeg,HM16652187525.jpeg,x716652187532.jpeg,KV16652187533.jpeg', NULL, '68', '#EMIPROD6702'),
(145, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652187631.jpeg', 'vert, jaune', 1, 1219, 'yes', '2022-10-08 08:46:07', '2025-12-20 07:53:09', 1, 'EC16652187641.jpeg,l316652187646.jpeg,vh16652187654.jpeg,C616652187655.jpeg,KH16652187662.jpeg,XC16652187673.jpeg', NULL, '68', '#EMIPROD4146'),
(146, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652187731.jpeg', 'vert, jaune, or', 1, 1209, 'yes', '2022-10-08 08:46:18', '2025-12-19 20:42:05', 1, 'S216652187741.jpeg,Gg16652187764.jpeg,Wd16652187775.jpeg,3c16652187772.jpeg,a516652187783.jpeg', NULL, '68', '#EMIPROD5124'),
(147, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652187841.jpeg', 'bleu, jaune', 1, 1140, 'yes', '2022-10-08 08:46:29', '2025-12-17 17:46:41', 1, 'Gr16652187851.jpeg,Bn16652187856.jpeg,tu16652187867.jpeg,QY16652187874.jpeg,Fj16652187875.jpeg,Nl16652187882.jpeg,fL16652187883.jpeg', NULL, '68', '#EMIPROD4747'),
(148, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652187951.jpeg', 'blanc, or', 1, 1191, 'yes', '2022-10-08 08:46:39', '2025-12-17 21:04:03', 1, 'to16652187951.jpeg,OR16652187966.jpeg,fm16652187967.jpeg,Uj16652187974.jpeg,LS16652187975.jpeg,2i16652187982.jpeg,Vk16652187983.jpeg', NULL, '68', '#EMIPROD1814'),
(149, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652188071.jpeg', 'rose, bleu', 1, 1243, 'yes', '2022-10-08 08:46:51', '2025-12-20 17:15:28', 1, '1w16652188071.jpeg,Rp16652188086.jpeg,wm16652188094.jpeg,eN16652188095.jpeg,8C16652188102.jpeg,fE16652188113.jpeg', NULL, '68', '#EMIPROD8174'),
(150, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652188181.jpeg', 'rose, rouge, or', 1, 1223, 'yes', '2022-10-08 08:47:02', '2025-12-20 16:44:27', 1, 'k016652188181.jpeg,9s16652188196.jpeg,6S16652188197.jpeg,gU16652188204.jpeg,zY16652188205.jpeg,2d16652188212.jpeg,ae16652188213.jpeg', NULL, '68', '#EMIPROD2411'),
(151, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652188301.jpeg', 'violet, or', 1, 1213, 'yes', '2022-10-08 08:47:14', '2025-12-20 04:37:36', 1, 'RX16652188301.jpeg,q116652188316.jpeg,gy16652188317.jpeg,gK16652188324.jpeg,H116652188325.jpeg,4G16652188332.jpeg,dL16652188333.jpeg', NULL, '68', '#EMIPROD7222'),
(152, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652188441.jpeg', 'blanc, or, rouge', 1, 1193, 'yes', '2022-10-08 08:47:28', '2025-12-20 13:59:04', 1, '7916652188441.jpeg,Vg16652188456.jpeg,WJ16652188457.jpeg,6Z16652188464.jpeg,ar16652188465.jpeg,s816652188472.jpeg,Sj16652188473.jpeg', NULL, '68', '#EMIPROD2644'),
(153, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652188541.jpeg', 'jaune, rose', 1, 1257, 'yes', '2022-10-08 08:47:37', '2025-12-18 19:07:28', 1, 'sU16652188541.jpeg,xw16652188556.jpeg,dB16652188554.jpeg,Uq16652188565.jpeg,cZ16652188562.jpeg,0i16652188573.jpeg', NULL, '68', '#EMIPROD2117'),
(154, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652188661.jpeg', 'rose, rouge, gris', 1, 1247, 'yes', '2022-10-08 08:47:57', '2025-12-17 20:45:00', 1, 'oi16652188661.jpeg,nB16652188676.jpeg,KQ16652188677.jpeg,pA16652188748.jpeg,cp16652188744.jpeg,YN16652188755.jpeg,pQ16652188762.jpeg,3116652188763.jpeg', NULL, '68', '#EMIPROD5199'),
(155, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652188861.jpeg', 'vert', 1, 1282, 'yes', '2022-10-08 08:48:11', '2025-12-19 03:23:31', 1, 'xS16652188871.jpeg,fI16652188876.jpeg,si16652188887.jpeg,Fx16652188894.jpeg,2716652188895.jpeg,we16652188902.jpeg,FB16652188903.jpeg', NULL, '68', '#EMIPROD6881'),
(156, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652189011.jpeg', 'rouge, rose, or', 1, 1262, 'yes', '2022-10-08 08:48:24', '2025-12-20 06:10:32', 1, 'DW16652189021.jpeg,oM16652189024.jpeg,OS16652189035.jpeg,RK16652189032.jpeg,x416652189043.jpeg', NULL, '68', '#EMIPROD7110'),
(157, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652189151.jpeg', 'jaune, or, noir', 1, 1535, 'yes', '2022-10-08 08:48:39', '2025-12-19 08:19:49', 1, 'qg16652189151.jpeg,kI16652189166.jpeg,ec16652189177.jpeg,6t16652189174.jpeg,F716652189185.jpeg,HR16652189182.jpeg,W416652189193.jpeg', NULL, '68', '#EMIPROD9391'),
(158, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652189261.jpeg', 'rose, or', 1, 1451, 'yes', '2022-10-08 08:48:49', '2025-12-20 18:15:33', 1, 'E316652189261.jpeg,cU16652189264.jpeg,gL16652189275.jpeg,gS16652189282.jpeg,wD16652189293.jpeg', NULL, '68', '#EMIPROD6518'),
(160, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652189611.jpeg', 'gris', 1, 1420, 'yes', '2022-10-08 08:49:25', '2025-12-20 02:38:05', 1, 'Yx16652189621.jpeg,Mw16652189626.jpeg,Bl16652189637.jpeg,OZ16652189634.jpeg,Yj16652189645.jpeg,EL16652189642.jpeg,ew16652189653.jpeg', NULL, '68', '#EMIPROD1346'),
(161, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652189811.jpeg', 'rouge, jaune', 1, 1492, 'yes', '2022-10-08 08:49:45', '2025-12-20 17:34:34', 1, '0016652189821.jpeg,j816652189824.jpeg,Ne16652189835.jpeg,8m16652189842.jpeg,n716652189843.jpeg', NULL, '68', '#EMIPROD6485'),
(162, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652189951.jpeg', 'jaune, rouge', 1, 1479, 'yes', '2022-10-08 08:49:59', '2025-12-20 03:25:11', 1, 'Gx16652189961.jpeg,2E16652189966.jpeg,Xl16652189974.jpeg,9l16652189975.jpeg,Nr16652189982.jpeg,qc16652189983.jpeg', NULL, '68', '#EMIPROD2129'),
(165, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652186611.jpeg', 'violet, or', 1, 1559, 'yes', '2022-10-08 08:44:26', '2025-12-19 19:55:32', 1, '6516652186621.jpeg,zu16652186626.jpeg,RV16652186637.jpeg,a916652186634.jpeg,hF16652186645.jpeg,k216652186642.jpeg,Ys16652186653.jpeg', NULL, '68', '#EMIPROD6440'),
(166, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16652189431.jpeg', 'vert, or', 1, 1431, 'yes', '2022-10-08 08:49:08', '2025-12-20 03:13:16', 1, 'qx16652189441.jpeg,Dy16652189456.jpeg,QE16652189454.jpeg,XV16652189465.jpeg,FI16652189472.jpeg,D016652189473.jpeg', NULL, '68', '#EMIPROD7014'),
(167, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640491771.jpeg', 'blanc, gris', 1, 1474, 'yes', '2022-09-24 19:53:00', '2025-12-20 03:05:02', 1, '2816640491771.jpeg,0s16640491784.jpeg,wd16640491795.jpeg,k016640491792.jpeg,RK16640491803.jpeg', NULL, '68', '#EMIPROD8606'),
(168, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640492401.jpeg', 'bleu, gris', 1, 1715, 'yes', '2022-09-24 19:54:04', '2025-12-19 19:46:14', 1, 'E316640492411.jpeg,Jx16640492416.jpeg,Uo16640492424.jpeg,EP16640492435.jpeg,Qx16640492432.jpeg,7616640492443.jpeg', NULL, '68', '#EMIPROD3113'),
(169, NULL, 'admin', 'Kente - Pagne tissé du Ghana', '67', '<ul><li>Pagne tissé du Ghana&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Pour vos cérémonies de mariages</li></ul>', 50000, 2, '16640495321.jpeg', 'rouge, vin, or, gris', 1, 1632, 'yes', '2022-09-24 19:58:57', '2025-12-20 04:05:21', 1, 'VP16640495331.jpeg,se16640495336.jpeg,JW16640495344.jpeg,JT16640495355.jpeg,l716640495352.jpeg,bx16640495363.jpeg', NULL, '68', '#EMIPROD7516'),
(181, NULL, 'admin', 'Couture - Pagne tissé', '71', '<ul><li>Couture - Pagne tissé du Ghana&nbsp;</li></li><li>Pour vos cérémonies et mariages</li></ul>', 50000, 1, '16656875771.jpeg', 'kente, mariage', 1, 1127, 'yes', '2022-10-13 18:59:40', '2025-12-19 10:41:08', 1, 'mO16656875781.jpeg,YC16656875784.jpeg,Ss16656875792.jpeg,8S16656875803.jpeg', NULL, '72', '#EMIPROD2094');
INSERT INTO `products` (`id`, `vendorid`, `owner`, `title`, `category`, `description`, `price`, `stock`, `feature_image`, `tags`, `featured`, `views`, `approved`, `created_at`, `updated_at`, `status`, `images`, `discount_id`, `subcategory`, `code`) VALUES
(182, NULL, 'admin', 'Couture - Pagne tissé', '71', '<ul><li>Couture - Pagne tissé du Ghana&nbsp;</li></li><li>Pour vos cérémonies et mariages</li></ul>', 50000, 1, '16656875841.jpg', 'kente, mariage', 1, 1584, 'yes', '2022-10-13 18:59:48', '2025-12-19 11:22:48', 1, 'W016656875854.jpg,Hm16656875862.jpg,g916656875873.jpg,Xe16656875881.jpg', NULL, '72', '#EMIPROD5858'),
(183, NULL, 'admin', 'Couture - Pagne tissé', '71', '<ul><li>Couture - Pagne tissé du Ghana&nbsp;</li></li><li>Pour vos cérémonies et mariages</li></ul>', 50000, 1, '16656875921.jpg', 'kente, mariage', 1, 1304, 'yes', '2022-10-13 18:59:56', '2025-12-19 14:52:12', 1, 'sY16656875934.jpg,VW16656875942.jpg,yd16656875943.jpg,wV16656875951.jpg', NULL, '72', '#EMIPROD5916'),
(184, NULL, 'admin', 'Couture - Pagne tissé', '71', '<ul><li>Couture - Pagne tissé du Ghana&nbsp;</li></li><li>Pour vos cérémonies et mariages</li></ul>', 50000, 1, '16656876001.jpg', 'kente, mariage', 1, 1364, 'yes', '2022-10-13 19:00:07', '2025-12-19 11:59:41', 1, 'w216656876014.jpg,tY16656876035.jpg,lu16656876042.jpg,gU16656876053.jpg,CT16656876061.jpg', NULL, '72', '#EMIPROD4929'),
(185, NULL, 'admin', 'Couture - Pagne tissé', '71', '<ul><li>Couture - Pagne tissé du Ghana&nbsp;</li></li><li>Pour vos cérémonies et mariages</li></ul>', 50000, 1, '16656876101.jpg', 'kente, mariage', 1, 1464, 'yes', '2022-10-13 19:00:14', '2025-12-19 12:26:25', 1, 'UZ16656876114.jpg,Gu16656876112.jpg,KA16656876123.jpg,Qa16656876131.jpg', NULL, '72', '#EMIPROD6537'),
(186, NULL, 'admin', 'Couture - Pagne tissé', '71', '<ul><li>Couture - Pagne tissé du Ghana&nbsp;</li></li><li>Pour vos cérémonies et mariages</li></ul>', 50000, 1, '16656876171.jpg', 'kente, mariage', 1, 1438, 'yes', '2022-10-13 19:00:20', '2025-12-20 05:56:41', 1, 'fJ16656876184.jpg,uX16656876182.jpg,xj16656876193.jpg,hc16656876201.jpg', NULL, '72', '#EMIPROD7244'),
(187, NULL, 'admin', 'Couture - Pagne tissé', '71', '<ul><li>Couture - Pagne tissé du Ghana&nbsp;</li></li><li>Pour vos cérémonies et mariages</li></ul>', 50000, 1, '16656876241.jpg', 'kente, mariage', 1, 1354, 'yes', '2022-10-13 19:00:29', '2025-12-20 04:56:45', 1, 'JQ16656876254.jpg,Fy16656876252.jpg,0416656876263.jpg,Q216656876271.jpg', NULL, '72', '#EMIPROD1394'),
(188, NULL, 'admin', 'Couture - Pagne tissé', '71', '<ul><li>Couture - Pagne tissé du Ghana&nbsp;</li></li><li>Pour vos cérémonies et mariages</li></ul>', 50000, 1, '16656876311.jpeg', 'kente, mariage', 1, 1380, 'yes', '2022-10-13 19:00:34', '2025-12-19 15:38:22', 1, 'CF16656876321.jpeg,gz16656876324.jpeg,ag16656876332.jpeg,Nc16656876333.jpeg', NULL, '72', '#EMIPROD8620'),
(189, NULL, 'admin', 'Couture - Pagne tissé', '71', '<ul><li>Couture - Pagne tissé du Ghana&nbsp;</li></li><li>Pour vos cérémonies et mariages</li></ul>', 50000, 1, '16656876361.jpeg', 'kente, mariage', 1, 1346, 'yes', '2022-10-13 19:00:40', '2025-12-19 16:47:19', 1, 'FT16656876371.jpeg,tY16656876374.jpeg,7J16656876385.jpeg,3R16656876392.jpeg,FU16656876393.jpeg', NULL, '72', '#EMIPROD3400'),
(190, NULL, 'admin', 'Couture - Pagne tissé', '71', '<ul><li>Couture - Pagne tissé du Ghana&nbsp;</li></li><li>Pour vos cérémonies et mariages</li></ul>', 50000, 1, '16656876431.jpg', 'kente, mariage', 1, 1301, 'yes', '2022-10-13 19:00:46', '2025-12-19 13:17:52', 1, '5v16656876444.jpg,rK16656876442.jpg,UL16656876453.jpg,dz16656876451.jpg', NULL, '72', '#EMIPROD4871'),
(191, NULL, 'admin', 'Couture - Pagne tissé', '71', '<ul><li>Couture - Pagne tissé du Ghana&nbsp;</li></li><li>Pour vos cérémonies et mariages</li></ul>', 50000, 1, '16656876491.jpeg', 'kente, mariage', 1, 1298, 'yes', '2022-10-13 19:00:51', '2025-12-19 22:04:57', 1, '6b16656876491.jpeg,SY16656876504.jpeg,2P16656876502.jpeg,5s16656876513.jpeg', NULL, '72', '#EMIPROD3239'),
(192, NULL, 'admin', 'Faso Danfani - Tissé au Burkina', '67', '<ul><li>Epaisseur: Semi-lourd&nbsp;</li><li>Qualité supérieure, dense et souple&nbsp;</li><li>Matériaux: 100 % coton </li></ul>', 50000, 2, '16661985371.png', 'jaune, or, fasodanfani', 1, 1060, 'yes', '2022-10-19 16:55:41', '2025-12-17 16:38:55', 1, 'vI16661985384.jpg,7r16661985392.jpg,XK16661985393.jpg,L616661985401.png', NULL, '70', '#EMIPROD9511');

-- --------------------------------------------------------

--
-- Table structure for table `product_gallery`
--

CREATE TABLE `product_gallery` (
  `id` int(11) NOT NULL,
  `productid` int(11) NOT NULL,
  `image` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `product_gallery`
--

INSERT INTO `product_gallery` (`id`, `productid`, `image`) VALUES
(1, 26, 'br150028710072d783df472ec91220ca7714adf113c6.jpg'),
(2, 26, 'tq1500287100E1F.jpg'),
(3, 25, 'B71510210868demo (1).jpg'),
(4, 25, '3t1510210868demo (2).jpg'),
(5, 25, '0W1510210868demo (3).jpg'),
(6, 25, 'ol1510210868demo (4).jpg'),
(7, 22, 'P91510210887demo (1).jpg'),
(8, 22, 'JB1510210887demo (2).jpg'),
(9, 22, '5I1510210887demo (3).jpg'),
(10, 22, 'hO1510210887demo (4).jpg'),
(11, 20, 'sx15102115136.jpg'),
(12, 20, 'jc1510211513demo (1).jpg'),
(13, 20, 'Lb1510211513demo (2).jpg'),
(14, 20, 'LD1510211513demo (3).jpg'),
(15, 28, 'zy1662403285log.png'),
(16, 28, 'qc1662403285logo HMCO.jpeg'),
(17, 28, 'zD1662405808pngegg (1).png'),
(18, 28, 'Zf1662405808pngegg.png');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `productid` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `review` text DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `review_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `section_titles`
--

CREATE TABLE `section_titles` (
  `id` int(11) NOT NULL,
  `service_title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `service_text` mediumtext COLLATE utf8_unicode_ci DEFAULT NULL,
  `pricing_title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `pricing_text` mediumtext COLLATE utf8_unicode_ci DEFAULT NULL,
  `portfolio_title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `portfolio_text` mediumtext COLLATE utf8_unicode_ci DEFAULT NULL,
  `testimonial_title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `testimonial_text` mediumtext COLLATE utf8_unicode_ci DEFAULT NULL,
  `team_title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `team_text` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `blog_title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `blog_text` text COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `section_titles`
--

INSERT INTO `section_titles` (`id`, `service_title`, `service_text`, `pricing_title`, `pricing_text`, `portfolio_title`, `portfolio_text`, `testimonial_title`, `testimonial_text`, `team_title`, `team_text`, `blog_title`, `blog_text`) VALUES
(1, 'Our Services', 'In publishing and graphic design, lorem ipsum is a filler text commonly used to demonstrate the graphic elements of a document or visual presentation.', 'Pricing Plans', 'In publishing and graphic design, lorem ipsum is a filler text commonly used to demonstrate the graphic elements of a document or visual presentation.', 'Latest Projects', 'In publishing and graphic design, lorem ipsum is a filler text commonly used to demonstrate the graphic elements of a document or visual presentation.', 'Customer Reviews', 'In publishing and graphic design, lorem ipsum is a filler text commonly used to demonstrate the graphic elements of a document or visual presentation.', 'Our Team', 'In publishing and graphic design, lorem ipsum is a filler text commonly used to demonstrate the graphic elements of a document or visual presentation.', 'Latest Blogs', 'In publishing and graphic design, lorem ipsum is a filler text commonly used to demonstrate the graphic elements of a document or visual presentation.');

-- --------------------------------------------------------

--
-- Table structure for table `service_section`
--

CREATE TABLE `service_section` (
  `id` int(11) NOT NULL,
  `title` varchar(255) CHARACTER SET latin1 NOT NULL,
  `text` text CHARACTER SET latin1 NOT NULL,
  `icon` varchar(255) CHARACTER SET latin1 NOT NULL,
  `status` int(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `service_section`
--

INSERT INTO `service_section` (`id`, `title`, `text`, `icon`, `status`) VALUES
(2, 'Service Name Here', 'Lorem Ipsum is simply dummy text of the printing and typeseatting industry. Lorem Ipsum has been the industry\'s', 'jz52.jpg', 1),
(3, 'Service Name Here', 'Lorem Ipsum is simply dummy text of the printing and typeseatting industry. Lorem Ipsum has been the industry\'s', '4rY3.jpg', 1),
(4, 'Service Name Here', 'Lorem Ipsum is simply dummy text of the printing and typeseatting industry. Lorem Ipsum has been the industry\'s', 'BfMUntitled-1.jpg', 1);

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `logo` varchar(255) CHARACTER SET latin1 NOT NULL,
  `favicon` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `title` varchar(255) CHARACTER SET latin1 NOT NULL,
  `url` varchar(255) CHARACTER SET latin1 NOT NULL,
  `about` text CHARACTER SET latin1 NOT NULL,
  `address` varchar(255) CHARACTER SET latin1 NOT NULL,
  `phone` varchar(50) CHARACTER SET latin1 NOT NULL,
  `fax` varchar(50) CHARACTER SET latin1 NOT NULL,
  `email` varchar(255) CHARACTER SET latin1 NOT NULL,
  `footer` varchar(255) CHARACTER SET latin1 NOT NULL,
  `background` varchar(255) CHARACTER SET latin1 NOT NULL,
  `theme_color` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `withdraw_fee` float NOT NULL DEFAULT 0,
  `withdraw_charge` float NOT NULL DEFAULT 0,
  `paypal_business` varchar(255) CHARACTER SET latin1 NOT NULL,
  `shipping_cost` float DEFAULT 0,
  `stripe_key` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `stripe_secret` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mobile_money` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `bank_wire` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `dynamic_commission` float NOT NULL DEFAULT 0,
  `tax` float NOT NULL DEFAULT 0,
  `fixed_commission` float NOT NULL DEFAULT 0,
  `currency_sign` varchar(255) COLLATE utf8_unicode_ci DEFAULT '$',
  `currency_code` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `popular_tags` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `css_file` varchar(255) CHARACTER SET latin1 NOT NULL,
  `stripe_status` int(11) NOT NULL DEFAULT 1,
  `paypal_status` int(11) NOT NULL DEFAULT 1,
  `mobile_status` int(11) NOT NULL DEFAULT 1,
  `bank_status` int(11) NOT NULL DEFAULT 1,
  `cash_status` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `logo`, `favicon`, `title`, `url`, `about`, `address`, `phone`, `fax`, `email`, `footer`, `background`, `theme_color`, `withdraw_fee`, `withdraw_charge`, `paypal_business`, `shipping_cost`, `stripe_key`, `stripe_secret`, `mobile_money`, `bank_wire`, `dynamic_commission`, `tax`, `fixed_commission`, `currency_sign`, `currency_code`, `popular_tags`, `css_file`, `stripe_status`, `paypal_status`, `mobile_status`, `bank_status`, `cash_status`) VALUES
(1, 'logo.png', 'favicon.ico', 'Latest - Multivendor Ecommerce', 'Fuckcccccc', 'Bootiqo est un produit de Smile World International, entreprise basee en Cote D\'Ivoire et specialise dans le e-commerce, solution de paiement en et le Multi-Level Marketing', 'Residence Fodie, Apt A11\r\nCocody, Angre 8ieme Tranche\r\nAbidjan, Cote D\'ivoire', '22542784249', '22542784249', 'admin@bootiqo.com', 'COPYRIGHT 2017 <a href=\"http://geniusocean.com\">bootiqo.com<br></a>', 'smm-min2.jpg', '#000000', 0, 0, 'shaon143-facilitator-1@gmail.com', 5, 'pk_test_bD5Si0msHNV75sd5R71jSJFb', 'YOUR_STRIPE_SECRET_KEY', 'Faites vos depots sur les numero suivant 42784249 / 78939896 / 04835863', 'Compte Bancaire', 3, 1, 3, '$', 'USD', 'One,Two,Three,Four', 'genius1.css', 1, 1, 1, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `site_language`
--

CREATE TABLE `site_language` (
  `id` int(11) NOT NULL,
  `home` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `about_us` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `contact_us` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `faq` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `search` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vendor` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `my_account` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `my_cart` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `view_cart` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `checkout` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `continue_shopping` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `proceed_to_checkout` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `empty_cart` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `unit_price` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `subtotal` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `total` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `quantity` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `add_to_cart` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `out_of_stock` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `available` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `reviews` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `related_products` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `return_policy` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `no_review` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `write_a_review` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `subscription` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `subscribe` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `added_to_cart` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `share_in_social` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `top_category` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `featured_products` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `latest_products` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `popular_products` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `search_result` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `no_result` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `contact_us_today` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `filter_option` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `all_categories` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `load_more` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `sort_by_latest` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `sort_by_oldest` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `sort_by_highest` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `sort_by_lowest` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `street_address` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `fax` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `submit` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `review_details` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `enter_shipping` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `order_details` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `shipping_cost` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `order_now` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `dashboard` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `update_profile` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `change_password` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `login_as` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `sign_in` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `popular_tags` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `latest_blogs` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `footer_links` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `view_details` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `quick_review` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `blog` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ship_to_another` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `pickup_details` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `logout` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `site_language`
--

INSERT INTO `site_language` (`id`, `home`, `about_us`, `contact_us`, `faq`, `search`, `vendor`, `my_account`, `my_cart`, `view_cart`, `checkout`, `continue_shopping`, `proceed_to_checkout`, `empty_cart`, `product_name`, `unit_price`, `subtotal`, `total`, `quantity`, `add_to_cart`, `out_of_stock`, `available`, `reviews`, `related_products`, `return_policy`, `no_review`, `write_a_review`, `subscription`, `subscribe`, `address`, `added_to_cart`, `description`, `share_in_social`, `top_category`, `featured_products`, `latest_products`, `popular_products`, `search_result`, `no_result`, `contact_us_today`, `filter_option`, `all_categories`, `load_more`, `sort_by_latest`, `sort_by_oldest`, `sort_by_highest`, `sort_by_lowest`, `street_address`, `phone`, `email`, `fax`, `submit`, `name`, `review_details`, `enter_shipping`, `order_details`, `shipping_cost`, `order_now`, `dashboard`, `update_profile`, `change_password`, `login_as`, `sign_in`, `popular_tags`, `latest_blogs`, `footer_links`, `view_details`, `quick_review`, `blog`, `ship_to_another`, `pickup_details`, `logout`) VALUES
(1, 'Home', 'About Us', 'Contact Us', 'FAQ', 'Search', 'Vendor', 'My Account', 'My Cart', 'View Cart', 'Checkout', 'Continue Shopping', 'Proceed To Checkout', 'Your Cart is Empty.', 'Product Name', 'Unit Price', 'SubTotal', 'Total', 'Quantity', 'Add To Cart', 'Out of Stock', 'Available', 'Reviews', 'Related Products', 'Return Policy', 'No Review', 'Write A Review', 'Subscription', 'Subscribe', 'Address', 'Successfully Added To Cart', 'Description', 'Share in Social', 'Top Category', 'Featured Products', 'Latest Products', 'Popular Products', 'Search Result', 'No Products Found', 'Contact Us Today!', 'Filter Option', 'All Categories', 'Load More', 'Sort By Latest Products', 'Sort By Oldest Products', 'Sort By Highest Price', 'Sort By Lowest Price', 'Street Address', 'Phone', 'E-mail', 'Fax', 'Submit', 'Name', 'Review Details', 'Enter Shipping Details', 'Order Details', 'Shipping Cost', 'Order Now', NULL, NULL, NULL, NULL, 'Sign In', 'Popular Tags', 'Latest Blogs', 'Footer Links', 'View Details', 'Quick Review', 'Blog', 'Ship to a Different Address?', 'Pickup From The Location you Selected', 'Logout');

-- --------------------------------------------------------

--
-- Table structure for table `sliders`
--

CREATE TABLE `sliders` (
  `id` int(11) NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `text` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `image` varchar(255) CHARACTER SET latin1 NOT NULL,
  `text_position` varchar(255) CHARACTER SET latin1 NOT NULL,
  `status` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `sliders`
--

INSERT INTO `sliders` (`id`, `title`, `text`, `image`, `text_position`, `status`) VALUES
(3, 'Slider Title 1', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry', 'BrUslider.jpg', 'slide_style_left', 1),
(4, 'Slider Title 2', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry', '8Nsslider3.jpg', 'slide_style_center', 1),
(5, 'Slider Title 3', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry', 'RWXslider1.jpg', 'slide_style_right', 1);

-- --------------------------------------------------------

--
-- Table structure for table `social_links`
--

CREATE TABLE `social_links` (
  `id` int(11) NOT NULL,
  `facebook` varchar(255) NOT NULL,
  `twiter` varchar(255) NOT NULL,
  `g_plus` varchar(255) NOT NULL,
  `linkedin` varchar(255) NOT NULL,
  `f_status` enum('enable','disable') NOT NULL DEFAULT 'enable',
  `t_status` enum('enable','disable') NOT NULL DEFAULT 'enable',
  `g_status` enum('enable','disable') NOT NULL DEFAULT 'enable',
  `link_status` enum('enable','disable') NOT NULL DEFAULT 'enable'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `social_links`
--

INSERT INTO `social_links` (`id`, `facebook`, `twiter`, `g_plus`, `linkedin`, `f_status`, `t_status`, `g_status`, `link_status`) VALUES
(1, 'http://facebook.com/ebangladesh', 'http://twitter.com/', 'http://google.com/', 'http://linkedin.com/', 'enable', 'enable', 'enable', 'enable');

-- --------------------------------------------------------

--
-- Table structure for table `subscription`
--

CREATE TABLE `subscription` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `testimonials`
--

CREATE TABLE `testimonials` (
  `id` int(11) NOT NULL,
  `review` text CHARACTER SET latin1 NOT NULL,
  `client` varchar(255) CHARACTER SET latin1 NOT NULL,
  `designation` varchar(255) CHARACTER SET latin1 NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `testimonials`
--

INSERT INTO `testimonials` (`id`, `review`, `client`, `designation`) VALUES
(1, 'In publishing and graphic design, lorem ipsum is a filler text commonly used to demonstrate the graphic elements of a document or visual presentation.', 'eBangladesh', 'Project Manager'),
(2, 'In publishing and graphic design, lorem ipsum is a filler text commonly used to demonstrate the graphic elements of a document or visual presentation.', 'The Usual Suspects', 'Owner'),
(3, 'In publishing and graphic design, lorem ipsum is a filler text commonly used to demonstrate the graphic elements of a document or visual presentation.', 'The Usual Suspects', 'Owner');

-- --------------------------------------------------------

--
-- Table structure for table `user_profiles`
--

CREATE TABLE `user_profiles` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `phone` varchar(255) NOT NULL,
  `fax` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `zip` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `status` int(11) NOT NULL DEFAULT 1
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Dumping data for table `user_profiles`
--

INSERT INTO `user_profiles` (`id`, `name`, `gender`, `phone`, `fax`, `email`, `password`, `address`, `city`, `zip`, `created_at`, `updated_at`, `status`) VALUES
(2, 'ShaOn Zaman', NULL, '000 000 000', NULL, 'shaoneel@gmail.com', '$2y$10$yLutetJU78vZ4uFDRaXmRu8O51bP.Avz5Fc2L4bE3U/PciaXu.Y56', 'Los Angels, United States', 'Los Angels', '6600', '0000-00-00 00:00:00', '2017-11-11 10:02:58', 1),
(3, 'Eden', NULL, '5146590891', NULL, 'eden12.ecommerce@gmail.com', '$2y$10$thVEZkn8NooXYmJthh9aRealZ69J/8HjEmaCQuH1S6Yg6u7no1X5y', NULL, NULL, NULL, '2020-05-02 16:23:27', '2020-05-02 16:23:27', 1);

-- --------------------------------------------------------

--
-- Table structure for table `vendor_profiles`
--

CREATE TABLE `vendor_profiles` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `shop_name` varchar(255) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `phone` varchar(255) NOT NULL,
  `fax` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `zip` varchar(255) DEFAULT NULL,
  `current_balance` float NOT NULL DEFAULT 0,
  `remember_token` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Dumping data for table `vendor_profiles`
--

INSERT INTO `vendor_profiles` (`id`, `name`, `shop_name`, `photo`, `gender`, `phone`, `fax`, `email`, `password`, `address`, `city`, `zip`, `current_balance`, `remember_token`, `created_at`, `updated_at`, `status`) VALUES
(1, 'GeniusOcean', 'GeniusOcean', NULL, NULL, '', NULL, 'vendor@gmail.com', '$2y$10$DozM30vRGMY9aDIh2EKxROmvuJRtBMimO2ox/rF8uXjMBYBjLvVRe', NULL, NULL, NULL, 0, NULL, '0000-00-00 00:00:00', '2017-11-07 18:32:22', 1);

-- --------------------------------------------------------

--
-- Table structure for table `withdraws`
--

CREATE TABLE `withdraws` (
  `id` int(11) NOT NULL,
  `vendorid` int(11) DEFAULT NULL,
  `method` varchar(255) DEFAULT NULL,
  `acc_email` varchar(255) DEFAULT NULL,
  `iban` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `acc_name` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `swift` varchar(255) DEFAULT NULL,
  `reference` text DEFAULT NULL,
  `amount` float DEFAULT NULL,
  `fee` float DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `status` enum('pending','completed','rejected') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `withdraws`
--

INSERT INTO `withdraws` (`id`, `vendorid`, `method`, `acc_email`, `iban`, `country`, `acc_name`, `address`, `swift`, `reference`, `amount`, `fee`, `created_at`, `updated_at`, `status`) VALUES
(1, 1, 'Paypal', 'shaoneel@gmail.com', NULL, NULL, NULL, NULL, NULL, 'sssssssssssssssss', 2063.5, 63.5, '2017-07-25 10:29:33', '2017-07-25 10:32:58', 'rejected'),
(2, 1, 'Paypal', 'shaoneel@gmail.com', NULL, NULL, NULL, NULL, NULL, 'ssss', 2063.5, 63.5, '2017-07-25 10:34:32', '2017-07-25 10:35:58', 'rejected'),
(3, 1, 'Paypal', 'shaoneel@gmail.com', NULL, NULL, NULL, NULL, NULL, 'sssss', 2000, 63.5, '2017-07-25 10:36:14', '2017-07-25 10:36:57', 'rejected'),
(4, 1, 'Skrill', 'shaoneel@gmail.com', NULL, NULL, NULL, NULL, NULL, 'sssssssss', 1936.5, 63.5, '2017-07-25 10:37:08', '2017-07-25 10:37:42', 'rejected'),
(5, 1, 'Paypal', 'shaoneel@gmail.com', NULL, NULL, NULL, NULL, NULL, 'sss', 2000, 0, '2017-07-25 10:38:27', '2017-07-25 10:38:48', 'rejected'),
(6, 1, 'Paypal', 'shaoneel@gmail.com', NULL, NULL, NULL, NULL, NULL, 'ssss', 1936.5, 63.5, '2017-07-25 10:39:52', '2017-07-25 10:40:03', 'rejected'),
(7, 1, 'Paypal', 'shaoneel@gmail.com', NULL, NULL, NULL, NULL, NULL, 'sssssssssss', 1936.5, 63.5, '2017-07-25 10:59:39', '2017-07-25 10:59:49', 'completed');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `advertisements`
--
ALTER TABLE `advertisements`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `blogs`
--
ALTER TABLE `blogs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `brand_banner`
--
ALTER TABLE `brand_banner`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `code_scripts`
--
ALTER TABLE `code_scripts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `counter`
--
ALTER TABLE `counter`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `faqs`
--
ALTER TABLE `faqs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ordered_products`
--
ALTER TABLE `ordered_products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `page_settings`
--
ALTER TABLE `page_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pickup_locations`
--
ALTER TABLE `pickup_locations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `product_gallery`
--
ALTER TABLE `product_gallery`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `section_titles`
--
ALTER TABLE `section_titles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `service_section`
--
ALTER TABLE `service_section`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `site_language`
--
ALTER TABLE `site_language`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sliders`
--
ALTER TABLE `sliders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `social_links`
--
ALTER TABLE `social_links`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `subscription`
--
ALTER TABLE `subscription`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `testimonials`
--
ALTER TABLE `testimonials`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vendor_profiles`
--
ALTER TABLE `vendor_profiles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `withdraws`
--
ALTER TABLE `withdraws`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `advertisements`
--
ALTER TABLE `advertisements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `blogs`
--
ALTER TABLE `blogs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `brand_banner`
--
ALTER TABLE `brand_banner`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- AUTO_INCREMENT for table `code_scripts`
--
ALTER TABLE `code_scripts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `counter`
--
ALTER TABLE `counter`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;

--
-- AUTO_INCREMENT for table `faqs`
--
ALTER TABLE `faqs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `ordered_products`
--
ALTER TABLE `ordered_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `page_settings`
--
ALTER TABLE `page_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `pickup_locations`
--
ALTER TABLE `pickup_locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=193;

--
-- AUTO_INCREMENT for table `product_gallery`
--
ALTER TABLE `product_gallery`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `section_titles`
--
ALTER TABLE `section_titles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `service_section`
--
ALTER TABLE `service_section`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `site_language`
--
ALTER TABLE `site_language`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `sliders`
--
ALTER TABLE `sliders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `social_links`
--
ALTER TABLE `social_links`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `subscription`
--
ALTER TABLE `subscription`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `testimonials`
--
ALTER TABLE `testimonials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `vendor_profiles`
--
ALTER TABLE `vendor_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `withdraws`
--
ALTER TABLE `withdraws`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
