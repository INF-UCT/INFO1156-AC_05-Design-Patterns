using System;

namespace DesignPatternsExamples.Facade
{
    // Subsistema complejo 1
    class BankDatabase
    {
        public bool CheckAccount(string accountId) => true;
    }

    // Subsistema complejo 2
    class SecuritySystem
    {
        public bool ValidatePin(string pin) => true;
    }

    // Subsistema complejo 3
    class CashDispenser
    {
        public void DispenseCash(int amount) => Console.WriteLine($"Entregando ${amount} en efectivo...");
    }

    // La FACHADA (Facade) que simplifica el uso de los subsistemas
    public class AtmFacade
    {
        private BankDatabase _db = new BankDatabase();
        private SecuritySystem _security = new SecuritySystem();
        private CashDispenser _dispenser = new CashDispenser();

        // Un método simple que por dentro coordina toda la lógica compleja
        public void WithdrawMoney(string accountId, string pin, int amount)
        {
            Console.WriteLine("Iniciando retiro...");
            if (_security.ValidatePin(pin) && _db.CheckAccount(accountId))
            {
                _dispenser.DispenseCash(amount);
                Console.WriteLine("Retiro exitoso.");
            }
        }
    }

    class Program
    {
        static void Main()
        {
            AtmFacade atm = new AtmFacade();
            
            // El cliente interactúa con la fachada, sin conocer la base de datos o sistema de seguridad
            atm.WithdrawMoney("12345", "9999", 500);
        }
    }
}
