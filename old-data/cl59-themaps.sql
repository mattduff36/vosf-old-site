-- MariaDB dump 10.17  Distrib 10.4.12-MariaDB, for Linux (x86_64)
--
-- Host: web303.extendcp.co.uk    Database: cl59-themaps
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
-- Table structure for table `poi_example`
--

DROP TABLE IF EXISTS `poi_example`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poi_example` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `desc` text NOT NULL,
  `lat` text NOT NULL,
  `lon` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `poi_example`
--

LOCK TABLES `poi_example` WRITE;
/*!40000 ALTER TABLE `poi_example` DISABLE KEYS */;
INSERT INTO `poi_example` VALUES (1,'100 Club','Oxford Street, London  W1&lt;br/&gt;3 Nov 2010 : Buster Shuffle&lt;br/&gt;','51.514980','-0.144328'),(2,'93 Feet East','150 Brick Lane, London  E1 6RU&lt;br/&gt;7 Dec 2010 : Jenny &amp; Johnny&lt;br/&gt;','51.521710','-0.071737'),(3,'Adelphi Theatre','The Strand, London  WC2E 7NA&lt;br/&gt;11 Oct 2010 : Love Never Dies','51.511010','-0.120140'),(4,'Albany, The','240 Gt. Portland Street, London  W1W 5QU','51.521620','-0.143394'),(5,'Aldwych Theatre','Aldwych, London  WC2B 4DF&lt;br/&gt;11 Oct 2010 : Dirty Dancing','51.513170','-0.117503'),(6,'Alexandra Palace','Wood Green, London  N22&lt;br/&gt;30 Oct 2010 : Lynx All-Nighter','51.596490','-0.109514');
/*!40000 ALTER TABLE `poi_example` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'cl59-themaps'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-25 22:48:13
