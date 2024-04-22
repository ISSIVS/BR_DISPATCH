psql "user=postgres host=localhost port=5432"  < db.sql

psql -U postgres -w -d gea -f db.sql --password postgres 


