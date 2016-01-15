
using com.upvise.client;

namespace com.upvise.samples {

    class CustomField {

        public string id;
        public string name;
        public string type;
        public string options;

        public const string TABLE = "Notes.fields";

        private CustomField() {
        }

        public CustomField(string id, string name, string type) : this(id, name, type, null) {
        }

        public CustomField(string id, string name, string type, string options) {
            this.id = id;
            this.name = name;
            this.type = type;
            this.options = options;
        }

        public static CustomField fromJson(JSONObject obj) {
            CustomField field = new CustomField();

            field.id = obj.getString("id");
            field.name = obj.getString("name");
            field.type = obj.getString("type");
            field.options = obj.getString("seloptions");

            return field;
        }

        public JSONObject toJson() {
            JSONObject obj = new JSONObject();
            if (id != null) obj.put("id", id);
            if (name != null) obj.put("name", name);
            if (type != null) obj.put("type", type);
            if (options != null) obj.put("seloptions", options);
            return obj;
        }
        
    }
}
