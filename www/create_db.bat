psql "user=postgres password=postgres host=localhost port=5432"  < db.sql 

psql -Upostgres -w -d alejo -f db.sql --password postgres 

