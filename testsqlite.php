<?php


try
{
  //create or open the database
  $database = new SQLiteDatabase('myDatabase.sqlite', 0666, $error);
}
catch(Exception $e)
{
  die($error);
}

//add Movie table to database
$query = 'CREATE TABLE Movies ' .
         '(Title TEXT, Director TEXT, Year INTEGER)';

if(!$database->queryExec($query, $error))
{
  die($error);
}

//insert data into database
$query =
  'INSERT INTO Movies (Title, Director, Year) ' .
  'VALUES ("The Dark Knight", "Christopher Nolan", 2008); ' .

  'INSERT INTO Movies (Title, Director, Year) ' .
  'VALUES ("Cloverfield", "Matt Reeves", 2008); ' .

  'INSERT INTO Movies (Title, Director, YEAR) ' .
  'VALUES ("Beverly Hills Chihuahua", "Raja Gosnell", 2008)';

if(!$database->queryExec($query, $error))
{
  die($error);
}

//read data from database
$query = "SELECT * FROM Movies";
if($result = $database->query($query, SQLITE_BOTH, $error))
{
  while($row = $result->fetch())
  {
    print("Title: {$row['Title']} <br />" .
          "Director: {$row['Director']} <br />".
          "Year: {$row['Year']} <br /><br />");
  }
}
else
{
  die($error);
}
