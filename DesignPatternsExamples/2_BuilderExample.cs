using System;
using System.Collections.Generic;

namespace DesignPatternsExamples.Builder
{
    // 1. El producto complejo que queremos construir
    public class Sandwich
    {
        public string Bread { get; set; }
        public string Meat { get; set; }
        public List<string> Veggies { get; set; } = new List<string>();

        public void Show()
        {
            Console.WriteLine($"Sándwich de {Meat} en pan {Bread} con: {string.Join(", ", Veggies)}");
        }
    }

    // 2. El Builder (Constructor)
    public class SandwichBuilder
    {
        private Sandwich _sandwich = new Sandwich();

        // Los métodos devuelven la misma instancia "this" para poder encadenarlos
        public SandwichBuilder SetBread(string bread)
        {
            _sandwich.Bread = bread;
            return this;
        }

        public SandwichBuilder SetMeat(string meat)
        {
            _sandwich.Meat = meat;
            return this;
        }

        public SandwichBuilder AddVeggie(string veggie)
        {
            _sandwich.Veggies.Add(veggie);
            return this;
        }

        // Método final que devuelve el objeto ya ensamblado
        public Sandwich Build()
        {
            return _sandwich;
        }
    }

    class Program
    {
        static void Main()
        {
            // Construcción paso a paso (Fluent Interface)
            Sandwich mySandwich = new SandwichBuilder()
                .SetBread("Integral")
                .SetMeat("Pollo")
                .AddVeggie("Lechuga")
                .AddVeggie("Tomate")
                .Build();

            mySandwich.Show();
        }
    }
}
