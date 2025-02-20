import json
class ListOfListsEncoder(json.JSONEncoder):
	def default(self, obj):
		if isinstance(obj, list):
			return obj
		return json.JSONEncoder.default(self, obj)
# Opening JSON file
f = open('companies.json', encoding="utf8")

# returns JSON object as a dictionary
data = json.load(f)

newList = []

# Iterating through the json list
for i in data:
    #print(i)
    newList.append({})
    newList[-1]["name"] = i["name"]
    if("profile" in i):
        newList[-1]["profile"] = i["profile"]
        newList[-1]["profile"].pop("contactEmail",None)
        newList[-1]["profile"].pop("contactName",None)
        newList[-1]["profile"].pop("contactTitle",None)
        newList[-1]["profile"].pop("contactPhone",None)
        newList[-1]["profile"].pop("$requests",None)
        newList[-1]["profile"].pop("$updated",None)
        newList[-1]["profile"].pop("$submitted",None)
    if("jobs" in i):
        newList[-1]["jobs"]=i["jobs"]
        newList[-1]["jobs"].pop("$requests",None)
        newList[-1]["jobs"].pop("$updated",None)
        newList[-1]["jobs"].pop("$submitted",None)
    if("exposure" in i):
        newList[-1]["exposure"]=i["exposure"]
        newList[-1]["exposure"].pop("$requests",None)
        newList[-1]["exposure"].pop("$updated",None)
        newList[-1]["exposure"].pop("$submitted",None)
    newList[-1]["boothSpace"] = {}
    newList[-1]["boothSpace"]["name"] = i["boothSpace"]["name"]
    #print(newList[-1])

with open("newCompanies.json", "w", encoding="utf-8") as f:
    json.dump(newList, f, indent=2, ensure_ascii=False)

# Closing file
f.close()