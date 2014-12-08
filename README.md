#baby-sitting-co-op

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

[Total amount of unique parents member 0 has sat for: /member/0/totalUniqueParentsSatFor](http://localhost:8080/member/0/totalUniqueParentsSatFor)
(or any other facet of a member)

[All member-ids and their co-op points: /member/points](http://localhost:8080/member/points)

[All member-ids and their productivity-rankings (ordered by productivity-Ranking DESC): /member/productivityRanking](http://localhost:8080/member/productivityRanking)
