using System;

namespace DesignPatternsExamples.Strategy
{
    // 1. La interfaz compartida para todas las estrategias de algoritmos
    public interface IRouteStrategy
    {
        void BuildRoute(string origin, string destination);
    }

    // 2. Estrategias concretas
    public class CarRoute : IRouteStrategy
    {
        public void BuildRoute(string origin, string destination) => 
            Console.WriteLine($"Calculando ruta en AUTO de {origin} a {destination}. Tiempo: 20 min.");
    }

    public class WalkingRoute : IRouteStrategy
    {
        public void BuildRoute(string origin, string destination) => 
            Console.WriteLine($"Calculando ruta CAMINANDO de {origin} a {destination}. Tiempo: 1 hr.");
    }

    // 3. El Contexto que usa la estrategia
    public class Navigator
    {
        private IRouteStrategy _strategy;

        // Se le inyecta la estrategia deseada
        public Navigator(IRouteStrategy strategy)
        {
            _strategy = strategy;
        }

        // Permite cambiar la estrategia en tiempo de ejecución
        public void SetStrategy(IRouteStrategy strategy)
        {
            _strategy = strategy;
        }

        public void Calculate(string origin, string destination)
        {
            _strategy.BuildRoute(origin, destination);
        }
    }

    class Program
    {
        static void Main()
        {
            Navigator gps = new Navigator(new CarRoute());
            gps.Calculate("Casa", "Trabajo");

            // Cambiamos el comportamiento fácilmente sin tocar la clase Navigator
            gps.SetStrategy(new WalkingRoute());
            gps.Calculate("Casa", "Trabajo");
        }
    }
}
