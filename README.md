#baby-sitting-co-op
A small app for a job-interview.

### Installation
```
clone this repo
cd baby-sitting-co-op
npm i
npm test
# builds db from transactions.xml
npm run recover
# starts up REST API on port 8080
npm start 
```
### REST API end-points:

[Members: /member](http://localhost:8080/member)

[Details about member 0: /member/0](http://localhost:8080/member/0)

[Recommended sitters for member 0: member/0/recommendedSitters](http://localhost:8080/member/0/recommendedSitters)
(or any other facet of a member, try [member/0/points](http://localhost:8080/member/0/points) as well)

[All member-ids and their co-op points: /member/points](http://localhost:8080/member/points)

[All member-ids and their productivity-rankings (ordered by productivity-Ranking DESC): /member/productivityRanking](http://localhost:8080/member/productivityRanking)

### Productivity and recommendation-logic
Sitter points: (this one was given) - Total amount of children sat * duration

Sitter productivity: Points (see above) + Total amount of unique parents sat for + (-10% per 30 days since sitter last sat)

Parent sitter recommendation: Sitter productivity (see above) + 2 points per each time the sitter has sat for the parent in question
