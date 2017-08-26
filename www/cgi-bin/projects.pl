#!/usr/bin/perl
use MongoDB;
use Data::Printer {
	output         => 'stderr'	
};
use JSON; 
use Data::Structure::Util qw( unbless );

my $client = MongoDB->connect();
my $db = $client->get_database( 'projects' );
my $projects = $db->get_collection( 'projects' );
my $all_projects = $projects->find();

print "[";
my $noLines =0;
while (my $row = $all_projects->next) {
  unbless $row;
  $json = encode_json \%$row;
  if($noLines != 0) {
	  print ",";
  }
print $json;
$noLines = $noLines +1;
}
print "]";



