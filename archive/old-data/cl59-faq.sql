-- MariaDB dump 10.17  Distrib 10.4.12-MariaDB, for Linux (x86_64)
--
-- Host: web303.extendcp.co.uk    Database: cl59-faq
-- ------------------------------------------------------
-- Server version	10.4.17-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `signuser`
--

DROP TABLE IF EXISTS `signuser`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `signuser` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(200) CHARACTER SET utf8 NOT NULL,
  `phone` varchar(3000) NOT NULL,
  `email` varchar(30) NOT NULL,
  `password` varchar(30) NOT NULL,
  `grade` varchar(11) NOT NULL,
  `admin` varchar(30) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `signuser`
--

LOCK TABLES `signuser` WRITE;
/*!40000 ALTER TABLE `signuser` DISABLE KEYS */;
INSERT INTO `signuser` VALUES (4,'What is Voiceover Studio Finder?','If you have a studio or are voiceover talent and want to earn extra money, you can list your services here for improved SEO and more!','1','','',''),(5,'Can anyone sign up?','Yes. Anyone with a studio who hires it out for voiceover services can sign up.','2','','',''),(6,'Who is using it?','Agencies looking to place an artist into a studio nearby.','3','','',''),(7,'Why is it Â£25 for a yearâ€™s membership?','To expand, we need to make a small charge to keep VoiceoverStudioFinder live.','4','','',''),(8,'Can I add my social media links?','Yes, of course. Add all of them. ','5','','',''),(9,'What should I put on my profile page?','A brief description for your heading and then some specifics in your long description.','6','','',''),(10,'Why is there a character limit to the short description?','This is also your meta description, so it has great SEO benefits on search engines.','7','','',''),(11,'What should I add to my description?','Give some details of what you offer. Including useful services like directing, editing etc. ','8','','',''),(12,'What is a Featured Studio?','It\'s an option to place your studio on the homepage below the map.','9','','',''),(13,'I\'m a voiceover, can I create a profile?','From 2021 we now accept voiceovers. A great way to create a unique profile.','10','','',''),(14,'What is â€˜Verifiedâ€™ status?','Verified is for awesome studio profiles! Want to get verified? Contact us.','11','','',''),(15,'What if my user name is taken?','If you believe someone has it maliciously, then please let us know.','12','','',''),(16,'What happens if I change my username?','The old one will go back into the public domain for someone else to claim.','13','','',''),(17,'What happens if someone has maliciously taken a user name?','We monitor the site and won\'t tolerate inactive or spam accounts.','14','','',''),(18,'Do I have to display all my details?','No, you choose how much or how little, however there is a minimum.','15','','',''),(19,'What is my username?','This will be your own personal Studio Finder link. ie. www.voiceoverstudiofinder.com/username.','16','','',''),(20,'What are connections?','These are the ways studios can connect to clients. If you have them, list them.','17','','',''),(21,'Can I suggest other studios or voiceover to sign up?','Heck yeah! If they also have a great set up then we\'d love them to join.','18','','',''),(22,'Why do you need a phone number?','We don\'t. But some studios might want to show it to get in touch easier.','19','','',''),(23,'How do I contact a studio or talent?','Any messages go direct to your email supplied, not via the site.','20','','',''),(24,'Do you deal with bookings?','No. It is completely up to you to book with the talent or studio.','21','','',''),(25,'Do I need to show my rates?','Not at all. You decide what you would like to show on your profile. ','23','','',''),(26,'Do I have to show my address?','No. You have total control. Show & hide what you want. ','22','','',''),(27,'Can we suggest ideas?','Yes please! We want this to be your site too. Message us or use the contact us form. ','24','','',''),(28,'Why can\'t I zoom right in on the map?','We restrict the zoom so not to reveal exact streets for home studios. If you want to display your full address it\'s up to you.','25','','','');
/*!40000 ALTER TABLE `signuser` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'cl59-faq'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-25 22:48:41
