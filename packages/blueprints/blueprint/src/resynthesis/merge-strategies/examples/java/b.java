// Sample file used in merge strategy tests:
package helloworld;

import java.util.HashMap;
import java.util.Map;

public class App {
    public static void main(String[] args) {
        for (int i = 0; i < args.length; i++) {
            Map<Character, Integer> result = countCharacters(args[i]);
            System.out.println(result.getOrDefault('b', 0));
        }

        System.out.println("Finished");
    }
    
    public static Map<Character, Integer> countCharacters(final String input) {
        Map<Character, Integer> result = new HashMap<>();
        for (int i = 0; i < input.length(); i++) {
            char c = Character.toLowerCase(input.charAt(i));
            result.put(c, result.getOrDefault(c, 0) + 1);
        }

        // insert a comment:
        return result;
    }
}
