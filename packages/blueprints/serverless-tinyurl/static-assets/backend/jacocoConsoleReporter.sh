for file in $(find . -type f -name "jacoco.csv"); do
    awk -F, \
    '{ instructions += $4 + $5; covered += $5 } END \
     { print "jacoco coverage:  " FILENAME "\n" covered, "/", instructions, " instructions covered"; \
     print 100*covered/instructions, "% covered" }' \
    $file
done

